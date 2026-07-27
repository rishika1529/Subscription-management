import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import OpenAI from "openai";
import { PrismaService } from "../database/prisma.service";

@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);
  private openai: OpenAI;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    this.openai = new OpenAI({
      apiKey: this.configService.get("OPENAI_API_KEY"),
      baseURL:
        this.configService.get("OPENAI_BASE_URL") ||
        "https://generativelanguage.googleapis.com/v1beta/openai/",
    });
  }

  private get model(): string {
    return this.configService.get("OPENAI_MODEL") || "gemini-2.0-flash";
  }

  /** Non-streaming chat — used by the dashboard AI chat panel. */
  async chatSimple(userId: string, message: string): Promise<string> {
    const apiKey = this.configService.get("OPENAI_API_KEY");
    if (!apiKey) {
      return (
        "⚠️ The AI assistant isn't configured yet. " +
        "Add your **OPENAI_API_KEY** to the backend environment variables on Render, then redeploy."
      );
    }

    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          subscriptions: {
            where: { status: "ACTIVE" },
            include: { category: true, usageLogs: { take: 5 } },
          },
        },
      });

      const context = this.buildUserContext(user);

      const chatHistory = await this.prisma.aIChat.findFirst({
        where: { userId },
        orderBy: { updatedAt: "desc" },
      });

      const messages: any[] = [
        { role: "system", content: this.getSystemPrompt(context) },
        ...((chatHistory?.messages as any[]) || []).slice(-10),
        { role: "user", content: message },
      ];

      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages,
        temperature: 0.7,
        max_tokens: 1000,
      });

      const reply =
        response.choices[0]?.message?.content ||
        "Sorry, I could not generate a response.";

      // Persist chat history
      const newMessages = [
        ...((chatHistory?.messages as any[]) || []),
        { role: "user", content: message, timestamp: new Date() },
        { role: "assistant", content: reply, timestamp: new Date() },
      ];
      await this.prisma.aIChat.upsert({
        where: { userId },
        create: { userId, messages: newMessages },
        update: { messages: newMessages, updatedAt: new Date() },
      });

      return reply;
    } catch (error: any) {
      this.logger.error("AI chat error:", error.message);
      return `❌ AI error: ${error.message}. Make sure your OPENAI_API_KEY is valid and has credits.`;
    }
  }

  /** Streaming chat — kept for future SSE use. */
  async chat(userId: string, message: string): Promise<AsyncIterable<string>> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscriptions: {
          where: { status: "ACTIVE" },
          include: { category: true, usageLogs: { take: 5 } },
        },
      },
    });

    const context = this.buildUserContext(user);

    const chatHistory = await this.prisma.aIChat.findFirst({
      where: { userId },
      orderBy: { updatedAt: "desc" },
    });

    const messages: any[] = [
      { role: "system", content: this.getSystemPrompt(context) },
      ...((chatHistory?.messages as any[]) || []).slice(-10),
      { role: "user", content: message },
    ];

    const stream = await this.openai.chat.completions.create({
      model: this.model,
      messages,
      stream: true,
      temperature: 0.7,
      max_tokens: 1000,
    });

    const newMessages = [
      ...((chatHistory?.messages as any[]) || []),
      { role: "user", content: message, timestamp: new Date() },
    ];

    return this.streamResponse(stream, userId, newMessages);
  }

  private async *streamResponse(
    stream: any,
    userId: string,
    messages: any[],
  ): AsyncIterable<string> {
    let fullResponse = "";

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      if (content) {
        fullResponse += content;
        yield content;
      }
    }

    messages.push({
      role: "assistant",
      content: fullResponse,
      timestamp: new Date(),
    });

    await this.prisma.aIChat.upsert({
      where: { userId },
      create: { userId, messages },
      update: { messages, updatedAt: new Date() },
    });
  }

  async calculateSubscriptionValue(subscription: any): Promise<number> {
    const prompt = `
Analyze this subscription and provide a value score from 0-100:

Subscription: ${subscription.name}
Cost: $${subscription.amount}/${subscription.billingCycle}
Usage logs: ${JSON.stringify(subscription.usageLogs)}
Status: ${subscription.status}
Auto-renew: ${subscription.autoRenew}

Consider:
- Usage frequency
- Cost vs typical market rates
- Whether features are being used
- Overall value for money

Respond with ONLY a number between 0-100.
    `.trim();

    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 10,
      });

      const score = parseInt(
        response.choices[0].message.content?.trim() || "50",
      );
      return Math.max(0, Math.min(100, score));
    } catch (error) {
      this.logger.error("Failed to calculate value score:", error);
      return 50; // Default
    }
  }

  async generateMonthlyReport(userId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscriptions: {
          where: { status: "ACTIVE" },
          include: {
            category: true,
            usageLogs: {
              where: {
                date: {
                  gte: new Date(new Date().setMonth(new Date().getMonth() - 1)),
                },
              },
            },
            payments: {
              where: {
                createdAt: {
                  gte: new Date(new Date().setMonth(new Date().getMonth() - 1)),
                },
              },
            },
          },
        },
      },
    });

    const totalMonthly =
      user?.subscriptions.reduce((sum, s) => sum + s.amount, 0) || 0;

    const prompt = `
Generate a comprehensive monthly subscription report for a user.

Current subscriptions:
${JSON.stringify(
  user?.subscriptions.map((s) => ({
    name: s.name,
    amount: s.amount,
    category: s.category?.name,
    usage: s.usageLogs.length,
    valueScore: s.valueScore,
    healthScore: s.healthScore,
  })),
  null,
  2,
)}

Total monthly spend: $${totalMonthly}

Provide:
1. Spending summary
2. Usage insights
3. Underutilized subscriptions
4. Money-saving recommendations
5. Subscription health status

Make it conversational, insightful, and actionable. Use emojis sparingly for visual appeal.
    `.trim();

    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 1500,
      });

      return response.choices[0].message.content || "Unable to generate report";
    } catch (error) {
      this.logger.error("Failed to generate monthly report:", error);
      throw error;
    }
  }

  async findStreamingContent(query: string): Promise<string> {
    // Get streaming services data
    const services = await this.prisma.streamingService.findMany({
      where: {
        category: "Streaming",
        active: true,
      },
    });

    const prompt = `
User wants to find: "${query}"

Available streaming services and their content:
${JSON.stringify(
  services.map((s) => ({
    name: s.name,
    popularContent: s.popularContent,
  })),
  null,
  2,
)}

Tell the user which service(s) have this content. If multiple services have it, compare pricing.
If you're not sure, admit it and suggest they check the services' catalogs directly.

Be concise and helpful.
    `.trim();

    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.5,
        max_tokens: 300,
      });

      return (
        response.choices[0].message.content || "Unable to find information"
      );
    } catch (error) {
      this.logger.error("Failed to find streaming content:", error);
      throw error;
    }
  }

  async getSavingsRecommendations(userId: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscriptions: {
          where: { status: "ACTIVE" },
          include: {
            usageLogs: {
              where: {
                date: {
                  gte: new Date(new Date().setMonth(new Date().getMonth() - 1)),
                },
              },
            },
          },
        },
      },
    });

    const underutilized =
      user?.subscriptions.filter(
        (s) => (s.usageLogs?.length || 0) < 3 && s.amount > 10,
      ) || [];

    const recommendations = [];

    for (const sub of underutilized) {
      const monthlyCost = sub.amount;
      const usage = sub.usageLogs?.length || 0;

      recommendations.push({
        subscriptionId: sub.id,
        name: sub.name,
        monthlyCost,
        usage,
        recommendation:
          usage === 0
            ? "Consider cancelling - not used this month"
            : "Low usage detected - review if still needed",
        potentialSavings: monthlyCost,
        priority: usage === 0 ? "HIGH" : "MEDIUM",
      });
    }

    const totalPotentialSavings = recommendations.reduce(
      (sum, r) => sum + r.potentialSavings,
      0,
    );

    return {
      recommendations,
      totalPotentialSavings,
      message:
        recommendations.length > 0
          ? `You could save up to $${totalPotentialSavings.toFixed(2)}/month by optimizing these subscriptions.`
          : "Great job! Your subscriptions are being used efficiently.",
    };
  }

  private buildUserContext(user: any): string {
    const subscriptions = user?.subscriptions || [];
    const totalMonthly = subscriptions.reduce((sum, s) => sum + s.amount, 0);

    return `
User has ${subscriptions.length} active subscriptions.
Total monthly spend: $${totalMonthly}

Subscriptions:
${subscriptions
  .map(
    (s) =>
      `- ${s.name} ($${s.amount}/${s.billingCycle}) - Category: ${s.category?.name || "None"}`,
  )
  .join("\n")}
    `.trim();
  }

  private getSystemPrompt(context: string): string {
    return `
You are an AI assistant for SubTrack Pro, a premium subscription management platform.

You help users:
- Track and manage their subscriptions
- Find content across streaming platforms
- Discover cost-saving opportunities
- Analyze subscription value and usage
- Make informed decisions about renewals

User Context:
${context}

Guidelines:
- Be conversational and friendly
- Provide specific, actionable advice
- Use data to back up recommendations
- Be honest when you don't know something
- Format responses with markdown for readability
- Keep responses concise but informative

When asked about finding content:
- Check if it's on services the user subscribes to
- Suggest alternatives if needed
- Compare costs when relevant

When asked about savings:
- Identify underused subscriptions
- Calculate potential savings
- Prioritize recommendations by impact

Never make up information. If you need more data, ask the user.
    `.trim();
  }

  async getSuggestedPrompts(userId: string): Promise<string[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscriptions: {
          where: { status: "ACTIVE" },
          take: 5,
        },
      },
    });

    const prompts = [
      "Where can I watch Inception?",
      "Am I overspending on subscriptions?",
      "Which subscriptions should I cancel?",
      "What's the cheapest way to watch anime?",
    ];

    if (user?.subscriptions && user.subscriptions.length > 3) {
      prompts.push("Analyze my subscription spending");
      prompts.push("Find duplicate services");
    }

    if (user?.subscriptions && user.subscriptions.length === 0) {
      prompts.splice(
        0,
        prompts.length,
        "How do I get started?",
        "What subscriptions do people usually track?",
        "Help me find the best streaming service",
      );
    }

    return prompts.slice(0, 4);
  }
}
