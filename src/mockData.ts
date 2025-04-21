
import { User, GoogleAuthConfig, Email } from "@/types";
import { v4 } from "@/utils/uuid";

// Mock access tokens
export const mockAccessTokens: User[] = [
  {
    id: v4(),
    accessToken: "token123",
    isBlocked: false
  },
  {
    id: v4(),
    accessToken: "token456",
    isBlocked: true
  }
];

// Mock Google configurations
export const mockGoogleConfigs: GoogleAuthConfig[] = [
  {
    id: v4(),
    clientId: "117313602649-iqfdmqk6k4ioqecjc9ai2052etu8hgur.apps.googleusercontent.com",
    clientSecret: "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",
    projectId: "igneous-tracer-451515-g7",
    authUri: "https://accounts.google.com/o/oauth2/auth",
    tokenUri: "https://oauth2.googleapis.com/token",
    authProviderCertUrl: "https://www.googleapis.com/oauth2/v1/certs",
    isActive: true
  }
];

// Mock emails
export const mockEmails: Email[] = [
  {
    id: v4(),
    from: "netflix@netflix.com",
    to: "user@example.com",
    subject: "Your Netflix subscription",
    body: "Thank you for subscribing to Netflix. Your subscription is active and you can start watching right away.",
    date: new Date(Date.now() - 86400000).toISOString(),
    isRead: false,
    isHidden: false
  },
  {
    id: v4(),
    from: "billing@netflix.com",
    to: "user@example.com",
    subject: "Netflix billing receipt",
    body: "Your payment of $9.99 was successfully processed for your monthly Netflix subscription.",
    date: new Date(Date.now() - 172800000).toISOString(),
    isRead: true,
    isHidden: false
  },
  {
    id: v4(),
    from: "info@netflix.com",
    to: "user@example.com",
    subject: "New titles on Netflix this week",
    body: "Check out the latest movies and shows added to Netflix this week. Don't miss our new exciting original series!",
    date: new Date(Date.now() - 259200000).toISOString(),
    isRead: true,
    isHidden: true
  },
  {
    id: v4(),
    from: "no-reply@gmail.com",
    to: "user@example.com",
    subject: "Security alert for your Google Account",
    body: "We detected a new sign-in to your Google Account on a Windows device. If this was you, you don't need to do anything.",
    date: new Date(Date.now() - 432000000).toISOString(),
    isRead: false,
    isHidden: false
  },
  {
    id: v4(),
    from: "support@gmail.com",
    to: "user@example.com",
    subject: "Your storage is almost full",
    body: "You're running out of storage and won't be able to send or receive emails when you run out. Consider upgrading your storage plan.",
    date: new Date(Date.now() - 518400000).toISOString(),
    isRead: true,
    isHidden: false
  }
];
