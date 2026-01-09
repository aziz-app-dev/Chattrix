import { Schema, model, Types } from "mongoose";

export interface IConversation {
  _id: Types.ObjectId;
  type: "direct" | "group";
  name?: string;
  avatar?: string;
  participants: Types.ObjectId[];
  admin?: Types.ObjectId;
  lastMessage?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema = new Schema<IConversation>(
  {
    type: {
      type: String,
      enum: ["direct", "group"],
      required: true,
    },
    name: {
      type: String,
      trim: true,
    },
    avatar: {
      type: String,
      default: "",
    },
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    admin: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    lastMessage: {
      type: Schema.Types.ObjectId,
      ref: "Message",
    },
  },
  { timestamps: true }
);

export default model<IConversation>("Conversation", ConversationSchema);
