import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "./src/model/user_model.js";
import Conversation from "./src/model/conversation_model.js";
import Message from "./src/model/message_model.js";
import Call from "./src/model/call_model.js";

dotenv.config();

const AVATARS = [
  "https://i.pravatar.cc/150?img=1",
  "https://i.pravatar.cc/150?img=5",
  "https://i.pravatar.cc/150?img=12",
  "https://i.pravatar.cc/150?img=32",
  "https://i.pravatar.cc/150?img=45",
  "https://i.pravatar.cc/150?img=47",
  "https://i.pravatar.cc/150?img=56",
  "https://i.pravatar.cc/150?img=68",
];

const USERS = [
  { email: "demo@chattrix.app", password: "demo123456", name: "Alex Johnson", img: AVATARS[0] },
  { email: "sarah@chattrix.app", password: "demo123456", name: "Sarah Miller", img: AVATARS[1] },
  { email: "omar@chattrix.app", password: "demo123456", name: "Omar Hassan", img: AVATARS[2] },
  { email: "emma@chattrix.app", password: "demo123456", name: "Emma Davis", img: AVATARS[3] },
  { email: "liam@chattrix.app", password: "demo123456", name: "Liam Carter", img: AVATARS[4] },
  { email: "sofia@chattrix.app", password: "demo123456", name: "Sofia Reyes", img: AVATARS[5] },
  { email: "noah@chattrix.app", password: "demo123456", name: "Noah Kim", img: AVATARS[6] },
  { email: "mia@chattrix.app", password: "demo123456", name: "Mia Patel", img: AVATARS[7] },
];

const CONVERSATIONS: Array<{
  type: "direct" | "group";
  name?: string;
  index1: number;
  index2?: number;
  index3?: number;
  adminIndex?: number;
  messages: Array<{ sender: number; content: string; minutesAgo: number }>;
}> = [
  {
    type: "direct",
    index1: 0,
    index2: 1,
    messages: [
      { sender: 1, content: "Hey Alex! Did you see the new design mockups?", minutesAgo: 480 },
      { sender: 0, content: "Yeah just opened them! The chat bubbles look awesome 🎉", minutesAgo: 470 },
      { sender: 1, content: "Glad you like them. I tweaked the colors a bit", minutesAgo: 460 },
      { sender: 0, content: "The indigo accent is perfect, matches our brand", minutesAgo: 450 },
      { sender: 1, content: "Can we hop on a quick call later to review?", minutesAgo: 60 },
      { sender: 0, content: "Sure! Free after 3pm", minutesAgo: 55 },
      { sender: 1, content: "Perfect, I'll send an invite 👌", minutesAgo: 50 },
      { sender: 1, content: "Also, the video call feature works great now!", minutesAgo: 45 },
      { sender: 0, content: "Awesome, test it with me tonight?", minutesAgo: 40 },
      { sender: 1, content: "Deal! 🚀", minutesAgo: 35 },
    ],
  },
  {
    type: "direct",
    index1: 0,
    index2: 2,
    messages: [
      { sender: 2, content: "Salam Alex! Team meeting moved to 4pm today", minutesAgo: 300 },
      { sender: 0, content: "Noted, thanks Omar! Any agenda?", minutesAgo: 290 },
      { sender: 2, content: "Mostly the app roadmap and the new push notifications", minutesAgo: 280 },
      { sender: 2, content: "We're shipping this week 💪", minutesAgo: 275 },
      { sender: 0, content: "Amazing! The FCM setup is finally working", minutesAgo: 265 },
      { sender: 2, content: "I tested it on my device, notifications arrive instantly", minutesAgo: 255 },
      { sender: 0, content: "Great work! See you at 4 🤝", minutesAgo: 20 },
    ],
  },
  {
    type: "direct",
    index1: 0,
    index2: 3,
    messages: [
      { sender: 3, content: "Alex, can you review my PR when you have a minute?", minutesAgo: 600 },
      { sender: 0, content: "On it now Emma 👍", minutesAgo: 590 },
      { sender: 3, content: "Thanks! The socket reconnection logic is included", minutesAgo: 580 },
      { sender: 0, content: "Looks clean, just one comment about error handling", minutesAgo: 570 },
      { sender: 3, content: "Fixed it, pushing now", minutesAgo: 560 },
      { sender: 0, content: "Merged! Great work 🎯", minutesAgo: 555 },
      { sender: 3, content: "Yay! 🙌 Coffee's on me tomorrow", minutesAgo: 30 },
    ],
  },
  {
    type: "direct",
    index1: 0,
    index2: 4,
    messages: [
      { sender: 4, content: "Hey! Is the backend running yet?", minutesAgo: 150 },
      { sender: 0, content: "Yes, port 5001 is live", minutesAgo: 145 },
      { sender: 4, content: "Perfect, testing the API now", minutesAgo: 140 },
      { sender: 0, content: "Let me know if anything breaks", minutesAgo: 135 },
      { sender: 4, content: "All good so far! Auth and conversations work", minutesAgo: 130 },
      { sender: 4, content: "The seed data makes testing so much easier btw", minutesAgo: 5 },
    ],
  },
  {
    type: "direct",
    index1: 1,
    index2: 2,
    messages: [
      { sender: 2, content: "Sarah, the app icon looks stunning!", minutesAgo: 200 },
      { sender: 1, content: "Thanks Omar! Took a few iterations 😅", minutesAgo: 190 },
      { sender: 2, content: "Worth it, it's going to look great on the Play Store", minutesAgo: 185 },
      { sender: 1, content: "Let's schedule the demo for next week", minutesAgo: 180 },
    ],
  },
  {
    type: "group",
    name: "Chattrix Dev Team",
    index1: 0,
    index2: 1,
    index3: 2,
    adminIndex: 0,
    messages: [
      { sender: 0, content: "Team! New build is ready for testing 🚀", minutesAgo: 800 },
      { sender: 1, content: "Downloading now!", minutesAgo: 790 },
      { sender: 2, content: "Same here, will report any bugs", minutesAgo: 785 },
      { sender: 2, content: "The call UI is much smoother now", minutesAgo: 780 },
      { sender: 1, content: "Agreed! WebRTC is working flawlessly", minutesAgo: 770 },
      { sender: 0, content: "Don't forget to test group video calls too", minutesAgo: 760 },
      { sender: 1, content: "On it! How many max participants?", minutesAgo: 755 },
      { sender: 0, content: "Currently supporting up to 8, we can scale later", minutesAgo: 750 },
      { sender: 2, content: "Bluetooth chat is also working on Android", minutesAgo: 745 },
      { sender: 1, content: "Wait, that's still in? 😮", minutesAgo: 740 },
      { sender: 2, content: "Yes! Tested it with my phone and tablet", minutesAgo: 735 },
      { sender: 0, content: "Amazing, let's demo everything on Friday", minutesAgo: 730 },
      { sender: 2, content: "I'll bring the snacks 🍕", minutesAgo: 720 },
      { sender: 1, content: "And I'll bring the energy ☕", minutesAgo: 710 },
      { sender: 0, content: "Standup in 10 minutes everyone!", minutesAgo: 15 },
    ],
  },
  {
    type: "group",
    name: "Weekend Plans 🎉",
    index1: 1,
    index2: 3,
    index3: 4,
    adminIndex: 1,
    messages: [
      { sender: 1, content: "Who's up for a hike this Saturday?", minutesAgo: 900 },
      { sender: 3, content: "Me! What time?", minutesAgo: 890 },
      { sender: 4, content: "Count me in too", minutesAgo: 880 },
      { sender: 1, content: "Meeting at 9am at the trailhead. Don't forget water!", minutesAgo: 870 },
      { sender: 3, content: "I'll bring sandwiches 🥪", minutesAgo: 860 },
      { sender: 4, content: "I'll bring the snacks", minutesAgo: 850 },
      { sender: 1, content: "See you all there! 🌄", minutesAgo: 100 },
    ],
  },
];

const CALLS = [
  {
    type: "audio" as const,
    status: "ended" as const,
    initiatorIndex: 1,
    participantIndex: 0,
    daysAgo: 1,
    duration: 1240,
    endReason: "normal" as const,
  },
  {
    type: "video" as const,
    status: "ended" as const,
    initiatorIndex: 0,
    participantIndex: 1,
    daysAgo: 0,
    duration: 2350,
    endReason: "normal" as const,
  },
  {
    type: "video" as const,
    status: "missed" as const,
    initiatorIndex: 2,
    participantIndex: 0,
    daysAgo: 0,
    endReason: "missed" as const,
  },
  {
    type: "audio" as const,
    status: "declined" as const,
    initiatorIndex: 0,
    participantIndex: 3,
    daysAgo: 0,
    endReason: "declined" as const,
  },
];

const minutesToDate = (minutesAgo: number): Date => {
  return new Date(Date.now() - minutesAgo * 60000);
};

const seed = async (): Promise<void> => {
  try {
    const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/chattrix";
    await mongoose.connect(uri);
    console.log(`\n🔗 Connected to MongoDB: ${uri}`);

    console.log("🧹 Clearing existing data...");
    await Promise.all([
      User.deleteMany({}),
      Conversation.deleteMany({}),
      Message.deleteMany({}),
      Call.deleteMany({}),
    ]);

    console.log("👤 Creating users...");
    const users = [];
    for (const u of USERS) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(u.password, salt);
      users.push(
        await User.create({
          email: u.email,
          password: hashedPassword,
          name: u.name,
          img: u.img,
        })
      );
    }
    console.log(`   ✅ Created ${users.length} users`);

    console.log("💬 Creating conversations and messages...");
    for (const conv of CONVERSATIONS) {
      const participants = [conv.index1];
      if (conv.index2 !== undefined) participants.push(conv.index2);
      if (conv.index3 !== undefined) participants.push(conv.index3);

      const conversation = await Conversation.create({
        type: conv.type,
        name: conv.name,
        admin: conv.adminIndex !== undefined ? users[conv.adminIndex]._id : undefined,
        participants: participants.map((i) => users[i]._id),
      });

      let lastMessage: any = null;
      for (const msg of conv.messages) {
        const message = await Message.create({
          conversation: conversation._id,
          sender: users[msg.sender]._id,
          content: msg.content,
          type: "text",
          readBy: [users[msg.sender]._id],
          createdAt: minutesToDate(msg.minutesAgo),
          updatedAt: minutesToDate(msg.minutesAgo),
        });
        lastMessage = message;
        if (conv.messages[conv.messages.length - 1] === msg) {
          await Conversation.findByIdAndUpdate(conversation._id, {
            lastMessage: message._id,
            updatedAt: minutesToDate(msg.minutesAgo),
          });
        }
      }
      console.log(
        `   ✅ ${conv.type === "group" ? `Group "${conv.name}"` : `${users[conv.index1].name} ↔ ${users[conv.index2!].name}`} (${conv.messages.length} messages)`
      );
    }

    console.log("📞 Creating call history...");
    for (const call of CALLS) {
      const ended = call.status === "ended";
      const startedAt = new Date(
        Date.now() - call.daysAgo * 86400000 - (ended ? call.duration! * 1000 : 300000) - 3600000
      );
      await Call.create({
        type: call.type,
        status: call.status,
        initiator: users[call.initiatorIndex]._id,
        participants: [
          {
            user: users[call.initiatorIndex]._id,
            joinedAt: startedAt,
            leftAt: ended ? new Date(startedAt.getTime() + call.duration! * 1000) : undefined,
            status: ended ? "joined" : call.status,
          },
          {
            user: users[call.participantIndex]._id,
            joinedAt: ended ? new Date(startedAt.getTime() + 5000) : undefined,
            leftAt: ended ? new Date(startedAt.getTime() + call.duration! * 1000) : undefined,
            status: ended ? "joined" : call.status,
          },
        ],
        startedAt,
        endedAt: ended ? new Date(startedAt.getTime() + call.duration! * 1000) : undefined,
        duration: ended ? call.duration : undefined,
        isGroupCall: false,
        metadata: { endReason: call.endReason },
      });
    }
    console.log(`   ✅ Created ${CALLS.length} calls`);

    console.log("\n══════════════════════════════════════");
    console.log("🎉 SEED COMPLETE — Test credentials:");
    console.log("══════════════════════════════════════");
    users.forEach((u, i) => {
      console.log(`   ${u.name.padEnd(15)} ${u.email.padEnd(22)} demo123456`);
    });
    console.log("══════════════════════════════════════\n");

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ Seed error:", error);
    process.exit(1);
  }
};

seed();