import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service';
import OpenAI from 'openai';
import { google } from 'googleapis';

// Known subscription billing senders — improves signal-to-noise ratio
const BILLING_SENDERS = [
  'netflix', 'spotify', 'adobe', 'apple', 'amazon', 'google', 'microsoft',
  'youtube', 'hulu', 'disney', 'hbo', 'dropbox', 'notion', 'slack', 'zoom',
  'github', 'digitalocean', 'aws', 'heroku', 'vercel', 'figma', 'canva',
  'linkedin', 'grammarly', 'nordvpn', 'expressvpn', 'duolingo', 'coursera',
  'udemy', 'skillshare', 'masterclass', 'patreon', 'substack', 'medium',
  'nytimes', 'wsj', 'twitch', 'crunchyroll', 'funimation', 'paramount',
  'peacock', 'espn', 'dazn', 'icloud', 'onedrive', 'lastpass', '1password',
  'bitwarden', 'dashlane', 'malwarebytes', 'norton', 'mcafee', 'surfshark',
  'playstation', 'xbox', 'nintendo', 'steam', 'invoice', 'billing',
  'receipt', 'payment', 'subscription', 'renewal', 'charge',
];

@Injectable()
export class GmailService {
  private readonly logger = new Logger(GmailService.name);

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {}

  private get openai() {
    return new OpenAI({
      apiKey: this.config.get('OPENAI_API_KEY'),
      baseURL:
        this.config.get('OPENAI_BASE_URL') ||
        'https://generativelanguage.googleapis.com/v1beta/openai/',
    });
  }

  private get model() {
    return this.config.get('OPENAI_MODEL') || 'gemini-2.0-flash';
  }

  getAuthUrl(userId: string): string {
    const oauth2 = this.createOAuth2Client();
    return oauth2.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/userinfo.email',
      ],
      state: userId,
    });
  }

  async handleCallback(code: string, userId: string): Promise<void> {
    const oauth2 = this.createOAuth2Client();
    const { tokens } = await oauth2.getToken(code);

    if (!tokens.refresh_token) {
      throw new BadRequestException(
        'No refresh token received. Please disconnect this account and reconnect.',
      );
    }

    oauth2.setCredentials(tokens);
    const userinfo = google.oauth2({ version: 'v2', auth: oauth2 });
    const { data } = await userinfo.userinfo.get();
    const email = data.email || '';

    await this.prisma.gmailConnection.upsert({
      where: { userId_gmailEmail: { userId, gmailEmail: email } },
      create: {
        userId,
        gmailEmail: email,
        accessToken: tokens.access_token || '',
        refreshToken: tokens.refresh_token,
        expiresAt: new Date(tokens.expiry_date || Date.now() + 3600000),
      },
      update: {
        accessToken: tokens.access_token || '',
        refreshToken: tokens.refresh_token,
        expiresAt: new Date(tokens.expiry_date || Date.now() + 3600000),
        updatedAt: new Date(),
      },
    });
  }

  async getStatus(userId: string) {
    const connections = await this.prisma.gmailConnection.findMany({ where: { userId } });
    return {
      connected: connections.length > 0,
      accounts: connections.map(c => ({ id: c.id, email: c.gmailEmail })),
    };
  }

  async disconnect(userId: string, connectionId?: string) {
    if (connectionId) {
      await this.prisma.gmailConnection.deleteMany({ where: { id: connectionId, userId } });
    } else {
      await this.prisma.gmailConnection.deleteMany({ where: { userId } });
    }
  }

  async scanGmail(userId: string): Promise<DetectedSubscription[]> {
    const connections = await this.prisma.gmailConnection.findMany({ where: { userId } });
    if (connections.length === 0)
      throw new BadRequestException('No Gmail accounts connected. Connect at least one account first.');

    const allSnippets: string[] = [];

    // Scan ALL connected accounts
    for (const conn of connections) {
      try {
        const snippets = await this.scanSingleAccount(conn, userId);
        allSnippets.push(...snippets);
      } catch (err: any) {
        this.logger.warn(`Failed to scan ${conn.gmailEmail}: ${err.message}`);
      }
    }

    if (allSnippets.length === 0) return [];
    return this.extractWithAI(allSnippets);
  }

  private async scanSingleAccount(conn: any, userId: string): Promise<string[]> {
    const oauth2 = this.createOAuth2Client();
    oauth2.setCredentials({
      access_token: conn.accessToken,
      refresh_token: conn.refreshToken,
      expiry_date: conn.expiresAt.getTime(),
    });

    oauth2.on('tokens', async (tokens) => {
      if (tokens.access_token) {
        await this.prisma.gmailConnection.update({
          where: { id: conn.id },
          data: {
            accessToken: tokens.access_token,
            expiresAt: new Date(tokens.expiry_date || Date.now() + 3600000),
          },
        });
      }
    });

    const gmail = google.gmail({ version: 'v1', auth: oauth2 });

    const query = [
      'newer_than:180d',
      '(',
      BILLING_SENDERS.map(s => `from:${s}`).join(' OR '),
      ' OR subject:invoice OR subject:receipt OR subject:subscription OR subject:renewal OR subject:billing OR subject:charged',
      ')',
    ].join(' ');

    this.logger.log(`Scanning ${conn.gmailEmail} for userId=${userId}`);

    const listRes = await gmail.users.messages.list({ userId: 'me', q: query, maxResults: 100 });
    const messages = listRes.data.messages || [];
    if (messages.length === 0) return [];

    const snippets: string[] = [];
    const batchSize = 20;

    for (let i = 0; i < Math.min(messages.length, 60); i += batchSize) {
      const batch = messages.slice(i, i + batchSize);
      const fetched = await Promise.allSettled(
        batch.map(m =>
          gmail.users.messages.get({
            userId: 'me', id: m.id!,
            format: 'metadata',
            metadataHeaders: ['From', 'Subject', 'Date'],
          }),
        ),
      );
      for (const result of fetched) {
        if (result.status === 'fulfilled') {
          const msg = result.value.data;
          const headers = msg.payload?.headers || [];
          const from    = headers.find(h => h.name === 'From')?.value || '';
          const subject = headers.find(h => h.name === 'Subject')?.value || '';
          const date    = headers.find(h => h.name === 'Date')?.value || '';
          snippets.push(`Account: ${conn.gmailEmail}\nFrom: ${from}\nSubject: ${subject}\nDate: ${date}\nSnippet: ${msg.snippet || ''}`);
        }
      }
    }
    return snippets;
  }

  async searchGmail(userId: string, query: string): Promise<DetectedSubscription[]> {
    const connections = await this.prisma.gmailConnection.findMany({ where: { userId } });
    if (connections.length === 0)
      throw new BadRequestException('No Gmail accounts connected.');

    const allSnippets: string[] = [];

    for (const conn of connections) {
      try {
        const oauth2 = this.createOAuth2Client();
        oauth2.setCredentials({
          access_token: conn.accessToken,
          refresh_token: conn.refreshToken,
          expiry_date: conn.expiresAt.getTime(),
        });
        oauth2.on('tokens', async (tokens) => {
          if (tokens.access_token) {
            await this.prisma.gmailConnection.update({
              where: { id: conn.id },
              data: { accessToken: tokens.access_token, expiresAt: new Date(tokens.expiry_date || Date.now() + 3600000) },
            });
          }
        });

        const gmail = google.gmail({ version: 'v1', auth: oauth2 });
        // Search broadly — no strict time limit, case-insensitive, body + subject + sender
        const gmailQuery = `(subject:${query} OR from:${query} OR ${query}) newer_than:365d`;

        const listRes = await gmail.users.messages.list({ userId: 'me', q: gmailQuery, maxResults: 30 });
        const messages = listRes.data.messages || [];
        this.logger.log(`Search "${query}" in ${conn.gmailEmail}: found ${messages.length} messages`);

        const fetched = await Promise.allSettled(
          messages.slice(0, 20).map(m =>
            gmail.users.messages.get({ userId: 'me', id: m.id!, format: 'metadata', metadataHeaders: ['From', 'Subject', 'Date'] }),
          ),
        );
        for (const r of fetched) {
          if (r.status === 'fulfilled') {
            const headers = r.value.data.payload?.headers || [];
            const from    = headers.find(h => h.name === 'From')?.value || '';
            const subject = headers.find(h => h.name === 'Subject')?.value || '';
            const date    = headers.find(h => h.name === 'Date')?.value || '';
            allSnippets.push(`Account: ${conn.gmailEmail}\nFrom: ${from}\nSubject: ${subject}\nDate: ${date}\nSnippet: ${r.value.data.snippet || ''}`);
          }
        }
      } catch (err: any) {
        this.logger.warn(`Search failed for ${conn.gmailEmail}: ${err.message}`);
      }
    }

    if (allSnippets.length === 0) return [];
    // Pass the target name so AI knows exactly what to look for, lower confidence threshold
    return this.extractWithAI(allSnippets, query);
  }

  async parseCSV(userId: string, fileContent: string): Promise<DetectedSubscription[]> {
    if (!fileContent || fileContent.trim().length === 0) {
      throw new BadRequestException('File is empty.');
    }
    // Limit size to avoid huge AI prompts
    const truncated = fileContent.slice(0, 15000);
    return this.extractWithAI([`CSV/bank statement:\n${truncated}`]);
  }

  private async extractWithAI(inputs: string[], targetService?: string): Promise<DetectedSubscription[]> {
    if (inputs.length === 0) return [];

    const combined = inputs.slice(0, 80).join('\n---\n');
    const confidenceThreshold = targetService ? 0.2 : 0.3;

    const targetHint = targetService
      ? `\nIMPORTANT: The user is specifically looking for "${targetService}". If you find any email related to this service, include it even if the price isn't explicitly visible — make your best estimate based on known pricing for that service (e.g. Crunchyroll ~$7.99/mo, Spotify ~$9.99/mo). Set confidence to at least 0.4 if the email is clearly from/about that service.\n`
      : '';

    const prompt = `You are a subscription detection expert. Analyze the following email snippets or bank/CSV data and extract recurring subscription services.
${targetHint}
Data to analyze:
${combined}

Return a JSON array of detected subscriptions. Each object must have:
- name: string (service name, e.g. "Netflix", "Spotify")
- amount: number (monthly cost in numbers only, estimate if billing cycle differs)
- currency: string ("USD", "EUR", "GBP", "INR", "CAD", "AUD" — default "USD")
- billingCycle: "MONTHLY" | "YEARLY" | "QUARTERLY" | "WEEKLY"
- category: string (e.g. "Streaming", "Music", "Productivity", "Cloud Storage", "Gaming", "News", "Security", "Design", "Development", "Other")
- confidence: number (0-1, how confident you are this is a real subscription)
- detectedFrom: string (brief note like "invoice email" or "bank statement")

Rules:
- Only include items with confidence >= ${confidenceThreshold} (be generous — if the data clearly shows a subscription, set confidence 0.7+)
- Deduplicate — return each service once
- If you see "Adobe Creative Cloud" or just "Adobe", use "Adobe Creative Cloud" as the name
- Ignore one-time purchases, only recurring subscriptions
- If yearly price, divide by 12 for monthly amount
- Return ONLY valid JSON array, no markdown, no explanation`;

    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 2000,
      });

      const raw = response.choices[0]?.message?.content?.trim() || '[]';
      // Strip markdown fences
      let cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
      // If model returned text before/after the JSON array, extract just the array
      if (!cleaned.startsWith('[')) {
        const match = cleaned.match(/\[[\s\S]*\]/);
        cleaned = match ? match[0] : '[]';
      }
      const parsed: any[] = JSON.parse(cleaned);

      return parsed
        .filter(s => s.name && s.amount > 0 && s.confidence >= confidenceThreshold)
        .map(s => ({
          name: String(s.name).trim(),
          amount: Number(s.amount),
          currency: s.currency || 'USD',
          billingCycle: s.billingCycle || 'MONTHLY',
          category: s.category || 'Other',
          confidence: Number(s.confidence),
          detectedFrom: s.detectedFrom || 'email scan',
        }));
    } catch (err: any) {
      this.logger.error('AI extraction failed:', err.message);
      return [];
    }
  }

  private createOAuth2Client() {
    return new google.auth.OAuth2(
      this.config.get('GOOGLE_CLIENT_ID'),
      this.config.get('GOOGLE_CLIENT_SECRET'),
      this.config.get('GMAIL_REDIRECT_URI') ||
        `${this.config.get('BACKEND_URL') || 'http://localhost:4000'}/api/v1/gmail/callback`,
    );
  }
}

export interface DetectedSubscription {
  name: string;
  amount: number;
  currency: string;
  billingCycle: string;
  category: string;
  confidence: number;
  detectedFrom: string;
}
