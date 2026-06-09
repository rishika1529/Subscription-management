import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private brevoApiKey: string;
  private fromEmail: string;
  private fromName = 'SubTrack Pro';

  constructor(private configService: ConfigService) {
    this.brevoApiKey = this.configService.get('BREVO_API_KEY') || '';
    this.fromEmail   = this.configService.get('BREVO_FROM_EMAIL') || '';
  }

  // ── Public send methods ────────────────────────────────────────────────────

  async sendWelcomeEmail(email: string, firstName: string) {
    return this.send({
      to: email,
      subject: '🎉 Welcome to Subscription Manager!',
      html: this.getWelcomeTemplate(firstName),
    });
  }

  async sendSubscriptionAddedEmail(email: string, subscription: any) {
    return this.send({
      to: email,
      subject: `✅ ${subscription.name} subscription added`,
      html: this.getSubscriptionAddedTemplate(subscription),
    });
  }

  async sendVerificationEmail(email: string, token: string) {
    const verifyUrl = `${this.configService.get('FRONTEND_URL')}/auth/verify-email?token=${token}`;
    return this.send({
      to: email,
      subject: 'Verify your Subscription Manager account',
      html: this.getVerificationTemplate(verifyUrl),
    });
  }

  async sendPasswordResetEmail(email: string, token: string) {
    const resetUrl = `${this.configService.get('FRONTEND_URL')}/auth/reset-password?token=${token}`;
    return this.send({
      to: email,
      subject: 'Reset your Subscription Manager password',
      html: this.getPasswordResetTemplate(resetUrl),
    });
  }

  async sendRenewalReminder(email: string, subscription: any, daysUntil: number) {
    return this.send({
      to: email,
      subject: `⏰ ${subscription.name} renews in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}`,
      html: this.getRenewalReminderTemplate(subscription, daysUntil),
    });
  }

  async sendPaymentSuccessEmail(email: string, payment: any) {
    return this.send({
      to: email,
      subject: '✅ Payment successful',
      html: this.getPaymentSuccessTemplate(payment),
    });
  }

  async sendPaymentFailedEmail(email: string, payment: any) {
    return this.send({
      to: email,
      subject: '❌ Payment failed — action required',
      html: this.getPaymentFailedTemplate(payment),
    });
  }

  async sendSubscriptionUpdatedEmail(email: string, subscription: any) {
    return this.send({
      to: email,
      subject: `✏️ ${subscription.name} subscription updated`,
      html: this.getSubscriptionUpdatedTemplate(subscription),
    });
  }

  async sendSubscriptionRenewedEmail(email: string, subscription: any, newNextDate: Date) {
    const nextDateStr = newNextDate.toLocaleDateString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric',
    });
    return this.send({
      to: email,
      subject: `🔄 ${subscription.name} has been auto-renewed`,
      html: this.getSubscriptionRenewedTemplate(subscription, nextDateStr),
    });
  }

  async sendMonthlyReport(email: string, report: string) {
    return this.send({
      to: email,
      subject: '📊 Your monthly subscription report',
      html: this.getMonthlyReportTemplate(report),
    });
  }

  // ── Core send (Brevo HTTP API — works on Render free tier) ──────────────────

  private async send(data: { to: string; subject: string; html: string }) {
    if (!this.brevoApiKey) {
      this.logger.warn('BREVO_API_KEY not set — skipping email send');
      return { success: false, error: 'BREVO_API_KEY not configured' };
    }
    if (!this.fromEmail) {
      this.logger.warn('BREVO_FROM_EMAIL not set — skipping email send');
      return { success: false, error: 'BREVO_FROM_EMAIL not configured' };
    }
    try {
      this.logger.log(`Sending email to ${data.to} | subject: "${data.subject}"`);
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept':       'application/json',
          'api-key':      this.brevoApiKey,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          sender:      { name: this.fromName, email: this.fromEmail },
          to:          [{ email: data.to }],
          subject:     data.subject,
          htmlContent: data.html,
        }),
      });

      if (!res.ok) {
        const body = await res.text();
        this.logger.error(`Brevo rejected email to ${data.to}: ${res.status} ${body}`);
        return { success: false, error: `Brevo ${res.status}: ${body.slice(0, 300)}` };
      }

      const result: any = await res.json();
      this.logger.log(`✅ Email delivered to ${data.to} — Brevo messageId: ${result?.messageId}`);
      return { success: true, id: result?.messageId };
    } catch (err: any) {
      this.logger.error(`Email send failed for ${data.to}: ${err.message}`);
      return { success: false, error: err.message };
    }
  }

  // ── Email templates ────────────────────────────────────────────────────────

  private getVerificationTemplate(verifyUrl: string): string {
    const dashUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:3000';
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
      body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#000;color:#fff;margin:0;padding:0}
      .wrap{max-width:600px;margin:40px auto;background:linear-gradient(135deg,#1a1a1a,#0f0f0f);border:1px solid #222;border-radius:16px;overflow:hidden}
      .hdr{background:linear-gradient(135deg,#FF0033,#990020);padding:40px;text-align:center}
      .hdr h1{margin:0;font-size:26px;font-weight:700}
      .body{padding:40px}
      .body p{line-height:1.7;color:#aaa;font-size:15px;margin:0 0 16px}
      .btn{display:inline-block;padding:16px 36px;background:linear-gradient(135deg,#FF0033,#990020);color:#fff!important;text-decoration:none;border-radius:10px;font-weight:700;font-size:15px}
      .link{word-break:break-all;color:#666;font-size:13px;margin:12px 0}
      .footer{padding:24px 40px;background:#0a0a0a;text-align:center;font-size:13px;color:#555}
    </style></head><body><div class="wrap">
      <div class="hdr"><h1>✨ Verify your email</h1></div>
      <div class="body">
        <p>Thanks for signing up for <strong style="color:#fff">Subscription Manager</strong>! Please verify your email to get started:</p>
        <center style="margin:28px 0"><a href="${verifyUrl}" class="btn">Verify Email Address</a></center>
        <p class="link">${verifyUrl}</p>
        <p>This link expires in 24 hours. If you didn't create an account, ignore this email.</p>
      </div>
      <div class="footer"><p>© 2026 Subscription Manager · <a href="${dashUrl}" style="color:#FF0033">Visit App</a></p></div>
    </div></body></html>`.trim();
  }

  private getPasswordResetTemplate(resetUrl: string): string {
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
      body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#000;color:#fff;margin:0;padding:0}
      .wrap{max-width:600px;margin:40px auto;background:linear-gradient(135deg,#1a1a1a,#0f0f0f);border:1px solid #222;border-radius:16px;overflow:hidden}
      .hdr{background:linear-gradient(135deg,#3b82f6,#2563eb);padding:40px;text-align:center}
      .hdr h1{margin:0;font-size:26px;font-weight:700}
      .body{padding:40px}
      .body p{line-height:1.7;color:#aaa;font-size:15px;margin:0 0 16px}
      .btn{display:inline-block;padding:16px 36px;background:linear-gradient(135deg,#3b82f6,#2563eb);color:#fff!important;text-decoration:none;border-radius:10px;font-weight:700;font-size:15px}
      .link{word-break:break-all;color:#666;font-size:13px}
      .warn{background:#451a1a;border-left:4px solid #ef4444;padding:16px;margin:20px 0;border-radius:4px;font-size:14px;color:#ccc}
      .footer{padding:24px 40px;background:#0a0a0a;text-align:center;font-size:13px;color:#555}
    </style></head><body><div class="wrap">
      <div class="hdr"><h1>🔒 Reset your password</h1></div>
      <div class="body">
        <p>We received a request to reset your <strong style="color:#fff">Subscription Manager</strong> password. Click below to choose a new one:</p>
        <center style="margin:28px 0"><a href="${resetUrl}" class="btn">Reset Password</a></center>
        <p class="link">${resetUrl}</p>
        <div class="warn">⚠️ This link expires in <strong>1 hour</strong>. If you didn't request this, ignore this email — your password won't change.</div>
      </div>
      <div class="footer"><p>© 2026 Subscription Manager</p></div>
    </div></body></html>`.trim();
  }

  private getRenewalReminderTemplate(subscription: any, daysUntil: number): string {
    const dashUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:3000';
    const nextDate = subscription.nextBillingDate
      ? new Date(subscription.nextBillingDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      : 'N/A';
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
      body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#000;color:#fff;margin:0;padding:0}
      .wrap{max-width:600px;margin:40px auto;background:linear-gradient(135deg,#1a1a1a,#0f0f0f);border:1px solid #222;border-radius:16px;overflow:hidden}
      .hdr{background:linear-gradient(135deg,#f59e0b,#d97706);padding:40px;text-align:center}
      .hdr h1{margin:0;font-size:26px;font-weight:700}
      .body{padding:40px}
      .body p{line-height:1.7;color:#aaa;font-size:15px;margin:0 0 12px}
      .card{background:#1a1a1a;border:1px solid #333;border-radius:14px;padding:24px;margin:20px 0}
      .row{display:flex;justify-content:space-between;margin:8px 0;font-size:14px}
      .row span{color:#888} .row strong{color:#fff}
      .price{font-size:28px;font-weight:700;color:#FF0033;text-align:center;margin:12px 0}
      .btn{display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#FF0033,#990020);color:#fff!important;text-decoration:none;border-radius:10px;font-weight:700;font-size:14px;margin:4px}
      .footer{padding:24px 40px;background:#0a0a0a;text-align:center;font-size:13px;color:#555}
    </style></head><body><div class="wrap">
      <div class="hdr"><h1>⏰ Renewal Reminder</h1></div>
      <div class="body">
        <p>Your subscription is renewing <strong style="color:#fff">${daysUntil === 0 ? 'today' : `in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}`}</strong>.</p>
        <div class="card">
          <div class="row"><span>Service</span><strong>${subscription.name}</strong></div>
          <div class="row"><span>Amount</span><strong>$${Number(subscription.amount).toFixed(2)} ${subscription.currency || 'USD'}</strong></div>
          <div class="row"><span>Billing</span><strong>${subscription.billingCycle}</strong></div>
          <div class="row"><span>Next Renewal</span><strong>${nextDate}</strong></div>
        </div>
        <center><a href="${dashUrl}/dashboard" class="btn">Manage Subscriptions</a></center>
      </div>
      <div class="footer"><p>© 2026 Subscription Manager</p></div>
    </div></body></html>`.trim();
  }

  private getPaymentSuccessTemplate(payment: any): string {
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
      body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#000;color:#fff;margin:0;padding:0}
      .wrap{max-width:600px;margin:40px auto;background:linear-gradient(135deg,#1a1a1a,#0f0f0f);border:1px solid #222;border-radius:16px;overflow:hidden}
      .hdr{background:linear-gradient(135deg,#10b981,#059669);padding:40px;text-align:center}
      .hdr h1{margin:0;font-size:26px;font-weight:700}
      .body{padding:40px}
      .card{background:#1a1a1a;border:1px solid #333;border-radius:14px;padding:24px;margin:20px 0}
      .row{display:flex;justify-content:space-between;margin:10px 0;font-size:14px}
      .row span{color:#888} .row strong{color:#fff}
      .amount{font-size:32px;color:#10b981;font-weight:700;text-align:center;margin:16px 0}
      .footer{padding:24px 40px;background:#0a0a0a;text-align:center;font-size:13px;color:#555}
    </style></head><body><div class="wrap">
      <div class="hdr"><h1>✅ Payment Successful</h1></div>
      <div class="body">
        <div class="amount">$${payment.amount}</div>
        <div class="card">
          <div class="row"><span>Date</span><strong>${new Date(payment.paidAt || Date.now()).toLocaleString()}</strong></div>
          <div class="row"><span>Method</span><strong>${payment.paymentMethod || 'Card'}</strong></div>
          <div class="row"><span>Status</span><strong style="color:#10b981">Completed</strong></div>
        </div>
        <p style="color:#aaa;font-size:14px;text-align:center">Thank you for using Subscription Manager!</p>
      </div>
      <div class="footer"><p>© 2026 Subscription Manager</p></div>
    </div></body></html>`.trim();
  }

  private getPaymentFailedTemplate(payment: any): string {
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
      body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#000;color:#fff;margin:0;padding:0}
      .wrap{max-width:600px;margin:40px auto;background:linear-gradient(135deg,#1a1a1a,#0f0f0f);border:1px solid #222;border-radius:16px;overflow:hidden}
      .hdr{background:linear-gradient(135deg,#ef4444,#dc2626);padding:40px;text-align:center}
      .hdr h1{margin:0;font-size:26px;font-weight:700}
      .body{padding:40px}
      .body p{line-height:1.7;color:#aaa;font-size:15px;margin:0 0 16px}
      .btn{display:inline-block;padding:16px 32px;background:linear-gradient(135deg,#ef4444,#dc2626);color:#fff!important;text-decoration:none;border-radius:10px;font-weight:700;font-size:15px}
      .footer{padding:24px 40px;background:#0a0a0a;text-align:center;font-size:13px;color:#555}
    </style></head><body><div class="wrap">
      <div class="hdr"><h1>❌ Payment Failed</h1></div>
      <div class="body">
        <p>Your payment of <strong style="color:#fff">$${payment.amount}</strong> could not be processed.</p>
        ${payment.failureReason ? `<p>Reason: ${payment.failureReason}</p>` : ''}
        <p>Please update your payment method and try again.</p>
        <center style="margin:24px 0"><a href="#" class="btn">Update Payment Method</a></center>
      </div>
      <div class="footer"><p>© 2026 Subscription Manager</p></div>
    </div></body></html>`.trim();
  }

  private getWelcomeTemplate(firstName: string): string {
    const dashboardUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:3000';
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
      body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#000;color:#fff;margin:0;padding:0}
      .wrap{max-width:600px;margin:40px auto;background:linear-gradient(135deg,#1a1a1a,#0f0f0f);border:1px solid #222;border-radius:16px;overflow:hidden}
      .hdr{background:linear-gradient(135deg,#FF0033,#990020);padding:48px 40px;text-align:center}
      .hdr h1{margin:0;font-size:32px;font-weight:900;letter-spacing:2px}
      .hdr p{margin:12px 0 0;opacity:.85;font-size:15px}
      .body{padding:40px}
      .body p{line-height:1.7;color:#aaa;font-size:15px;margin:0 0 16px}
      .btn{display:inline-block;padding:16px 36px;background:linear-gradient(135deg,#FF0033,#990020);color:#fff!important;text-decoration:none;border-radius:10px;font-weight:700;font-size:15px;margin:8px 0;letter-spacing:.5px}
      .footer{padding:24px 40px;background:#0a0a0a;text-align:center;font-size:13px;color:#555}
    </style></head><body><div class="wrap">
      <div class="hdr"><h1>Subscription Manager</h1><p>Track. Save. Control.</p></div>
      <div class="body">
        <p>Hey ${firstName || 'there'} 👋</p>
        <p>Welcome to <strong style="color:#fff">Subscription Manager</strong> — your all-in-one dashboard for tracking every subscription, spotting wasteful spending, and getting renewal alerts before they hit your card.</p>
        <p>Here's what you can do right now:</p>
        <ul style="color:#aaa;line-height:2;padding-left:20px">
          <li>Add your first subscription (Netflix, Spotify, etc.)</li>
          <li>Get <strong style="color:#fff">email reminders</strong> 7 days before renewal</li>
          <li>Ask the <strong style="color:#fff">AI assistant</strong> for cost-cutting tips</li>
          <li>View analytics &amp; spending breakdown</li>
        </ul>
        <center style="margin-top:32px"><a href="${dashboardUrl}/dashboard" class="btn">Go to Dashboard →</a></center>
      </div>
      <div class="footer"><p>© 2026 Subscription Manager · <a href="${dashboardUrl}" style="color:#FF0033">Visit App</a></p></div>
    </div></body></html>`.trim();
  }

  private getSubscriptionAddedTemplate(subscription: any): string {
    const dashboardUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:3000';
    const monthly =
      subscription.billingCycle === 'YEARLY'    ? subscription.amount / 12
      : subscription.billingCycle === 'QUARTERLY' ? subscription.amount / 3
      : subscription.billingCycle === 'WEEKLY'    ? (subscription.amount * 52) / 12
      : subscription.amount;
    const nextDate = subscription.nextBillingDate
      ? new Date(subscription.nextBillingDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      : 'N/A';
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
      body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#000;color:#fff;margin:0;padding:0}
      .wrap{max-width:600px;margin:40px auto;background:linear-gradient(135deg,#1a1a1a,#0f0f0f);border:1px solid #222;border-radius:16px;overflow:hidden}
      .hdr{background:linear-gradient(135deg,#00c864,#009048);padding:40px;text-align:center}
      .hdr h1{margin:0;font-size:26px;font-weight:700}
      .body{padding:40px}
      .card{background:#1a1a1a;border:1px solid #333;border-radius:14px;padding:24px;margin:20px 0}
      .row{display:flex;justify-content:space-between;margin:10px 0;font-size:14px}
      .row span{color:#888} .row strong{color:#fff}
      .price{font-size:28px;font-weight:700;color:#FF0033;text-align:center;margin:16px 0}
      .btn{display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#FF0033,#990020);color:#fff!important;text-decoration:none;border-radius:10px;font-weight:700;font-size:14px;margin:8px 0}
      .footer{padding:24px 40px;background:#0a0a0a;text-align:center;font-size:13px;color:#555}
    </style></head><body><div class="wrap">
      <div class="hdr"><h1>✅ Subscription Added</h1></div>
      <div class="body">
        <p style="color:#aaa;font-size:15px"><strong style="color:#fff">${subscription.name}</strong> has been added to your Subscription Manager.</p>
        <div class="card">
          <div class="row"><span>Service</span><strong>${subscription.name}</strong></div>
          <div class="row"><span>Amount</span><strong>$${Number(subscription.amount).toFixed(2)} ${subscription.currency || 'USD'}</strong></div>
          <div class="row"><span>Billing</span><strong>${subscription.billingCycle || 'Monthly'}</strong></div>
          <div class="row"><span>Next Renewal</span><strong>${nextDate}</strong></div>
          <div class="price">$${monthly.toFixed(2)}<span style="font-size:14px;color:#888">/mo</span></div>
        </div>
        <p style="color:#aaa;font-size:14px">We'll remind you 7 days before the next renewal so you're never caught off guard.</p>
        <center><a href="${dashboardUrl}/dashboard" class="btn">View Dashboard</a></center>
      </div>
      <div class="footer"><p>© 2026 Subscription Manager</p></div>
    </div></body></html>`.trim();
  }

  private getSubscriptionUpdatedTemplate(subscription: any): string {
    const dashboardUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:3000';
    const monthly =
      subscription.billingCycle === 'YEARLY'    ? subscription.amount / 12
      : subscription.billingCycle === 'QUARTERLY' ? subscription.amount / 3
      : subscription.billingCycle === 'WEEKLY'    ? (subscription.amount * 52) / 12
      : subscription.amount;
    const nextDate = subscription.nextBillingDate
      ? new Date(subscription.nextBillingDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      : 'N/A';
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
      body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#000;color:#fff;margin:0;padding:0}
      .wrap{max-width:600px;margin:40px auto;background:linear-gradient(135deg,#1a1a1a,#0f0f0f);border:1px solid #222;border-radius:16px;overflow:hidden}
      .hdr{background:linear-gradient(135deg,#3b82f6,#2563eb);padding:40px;text-align:center}
      .hdr h1{margin:0;font-size:26px;font-weight:700}
      .body{padding:40px}
      .body p{line-height:1.7;color:#aaa;font-size:15px;margin:0 0 12px}
      .card{background:#1a1a1a;border:1px solid #333;border-radius:14px;padding:24px;margin:20px 0}
      .row{display:flex;justify-content:space-between;margin:8px 0;font-size:14px}
      .row span{color:#888} .row strong{color:#fff}
      .price{font-size:28px;font-weight:700;color:#FF0033;text-align:center;margin:12px 0}
      .btn{display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#FF0033,#990020);color:#fff!important;text-decoration:none;border-radius:10px;font-weight:700;font-size:14px;margin:8px 0}
      .footer{padding:24px 40px;background:#0a0a0a;text-align:center;font-size:13px;color:#555}
    </style></head><body><div class="wrap">
      <div class="hdr"><h1>✏️ Subscription Updated</h1></div>
      <div class="body">
        <p><strong style="color:#fff">${subscription.name}</strong> has been updated in your Subscription Manager.</p>
        <div class="card">
          <div class="row"><span>Service</span><strong>${subscription.name}</strong></div>
          <div class="row"><span>Amount</span><strong>$${Number(subscription.amount).toFixed(2)} ${subscription.currency || 'USD'}</strong></div>
          <div class="row"><span>Billing</span><strong>${subscription.billingCycle || 'Monthly'}</strong></div>
          <div class="row"><span>Next Renewal</span><strong>${nextDate}</strong></div>
          <div class="price">$${monthly.toFixed(2)}<span style="font-size:14px;color:#888">/mo</span></div>
        </div>
        <p style="font-size:14px">If you didn't make this change, please review your account immediately.</p>
        <center><a href="${dashboardUrl}/dashboard" class="btn">View Dashboard</a></center>
      </div>
      <div class="footer"><p>© 2026 Subscription Manager</p></div>
    </div></body></html>`.trim();
  }

  private getMonthlyReportTemplate(report: string): string {
    const dashUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:3000';
    const htmlReport = report
      .replace(/\n\n/g, '</p><p>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
      body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#000;color:#fff;margin:0;padding:0}
      .wrap{max-width:600px;margin:40px auto;background:linear-gradient(135deg,#1a1a1a,#0f0f0f);border:1px solid #222;border-radius:16px;overflow:hidden}
      .hdr{background:linear-gradient(135deg,#8b5cf6,#7c3aed);padding:40px;text-align:center}
      .hdr h1{margin:0;font-size:26px;font-weight:700}
      .body{padding:40px;line-height:1.7}
      .body p{color:#aaa;font-size:15px}
      .btn{display:inline-block;padding:16px 32px;background:linear-gradient(135deg,#8b5cf6,#7c3aed);color:#fff!important;text-decoration:none;border-radius:10px;font-weight:700;font-size:15px;margin:24px 0}
      .footer{padding:24px 40px;background:#0a0a0a;text-align:center;font-size:13px;color:#555}
    </style></head><body><div class="wrap">
      <div class="hdr"><h1>📊 Monthly Report</h1></div>
      <div class="body"><p>${htmlReport}</p>
        <center><a href="${dashUrl}/dashboard" class="btn">View Dashboard</a></center>
      </div>
      <div class="footer"><p>© 2026 Subscription Manager</p></div>
    </div></body></html>`.trim();
  }

  private getSubscriptionRenewedTemplate(subscription: any, nextDateStr: string): string {
    const dashboardUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:3000';
    const monthly =
      subscription.billingCycle === 'YEARLY'    ? subscription.amount / 12
      : subscription.billingCycle === 'QUARTERLY' ? subscription.amount / 3
      : subscription.billingCycle === 'WEEKLY'    ? (subscription.amount * 52) / 12
      : subscription.amount;
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
      body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#000;color:#fff;margin:0;padding:0}
      .wrap{max-width:600px;margin:40px auto;background:linear-gradient(135deg,#1a1a1a,#0f0f0f);border:1px solid #222;border-radius:16px;overflow:hidden}
      .hdr{background:linear-gradient(135deg,#10b981,#059669);padding:40px;text-align:center}
      .hdr h1{margin:0;font-size:26px;font-weight:700}
      .body{padding:40px}
      .body p{line-height:1.7;color:#aaa;font-size:15px;margin:0 0 12px}
      .card{background:#1a1a1a;border:1px solid #333;border-radius:14px;padding:24px;margin:20px 0}
      .row{display:flex;justify-content:space-between;margin:8px 0;font-size:14px}
      .row span{color:#888} .row strong{color:#fff}
      .price{font-size:28px;font-weight:700;color:#10b981;text-align:center;margin:12px 0}
      .badge{display:inline-block;padding:4px 12px;background:#10b981;color:#fff;border-radius:6px;font-size:12px;font-weight:600;margin-bottom:8px}
      .btn{display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#FF0033,#990020);color:#fff!important;text-decoration:none;border-radius:10px;font-weight:700;font-size:14px;margin:4px}
      .note{background:#1a1a2e;border-left:4px solid #3b82f6;padding:14px;margin:20px 0;border-radius:4px;font-size:13px;color:#94a3b8}
      .footer{padding:24px 40px;background:#0a0a0a;text-align:center;font-size:13px;color:#555}
    </style></head><body><div class="wrap">
      <div class="hdr"><h1>🔄 Auto-Renewed</h1></div>
      <div class="body">
        <center><span class="badge">Auto-Renewed</span></center>
        <p>Your <strong style="color:#fff">${subscription.name}</strong> subscription has been automatically renewed. No action needed on your end!</p>
        <div class="card">
          <div class="row"><span>Service</span><strong>${subscription.name}</strong></div>
          <div class="row"><span>Amount</span><strong>$${Number(subscription.amount).toFixed(2)} ${subscription.currency || 'USD'}</strong></div>
          <div class="row"><span>Billing</span><strong>${subscription.billingCycle || 'Monthly'}</strong></div>
          <div class="row"><span>Next Renewal</span><strong>${nextDateStr}</strong></div>
          <div class="price">$${monthly.toFixed(2)}<span style="font-size:14px;color:#888">/mo</span></div>
        </div>
        <div class="note">💡 Want to cancel or change this? Just edit or delete the subscription from your dashboard at any time.</div>
        <center><a href="${dashboardUrl}/dashboard" class="btn">Manage Subscriptions</a></center>
      </div>
      <div class="footer"><p>© 2026 Subscription Manager</p></div>
    </div></body></html>`.trim();
  }
}
