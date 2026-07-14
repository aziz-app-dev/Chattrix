import { model, Schema, Types } from "mongoose";

export interface ICallParticipant {
  user: Types.ObjectId;
  joinedAt?: Date;
  leftAt?: Date;
  status: "pending" | "joined" | "left" | "declined" | "missed";
}

export interface ICall {
  _id: Types.ObjectId;
  type: "audio" | "video";
  status:
    | "initiated"
    | "ringing"
    | "ongoing"
    | "ended"
    | "missed"
    | "declined"
    | "failed";
  initiator: Types.ObjectId;
  participants: ICallParticipant[];
  conversation?: Types.ObjectId;
  isGroupCall: boolean;
  startedAt?: Date;
  endedAt?: Date;
  duration?: number;
  metadata?: {
    endReason?: "normal" | "missed" | "declined" | "failed" | "timeout";
  };
  createdAt: Date;
  updatedAt: Date;
}

const CallParticipantSchema = new Schema<ICallParticipant>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    joinedAt: Date,
    leftAt: Date,
    status: {
      type: String,
      enum: ["pending", "joined", "left", "declined", "missed"],
      default: "pending",
    },
  },
  { _id: false },
);

const CallSchema = new Schema<ICall>(
  {
    type: {
      type: String,
      enum: ["audio", "video"],
      required: true,
    },
    status: {
      type: String,
      enum: [
        "initiated",
        "ringing",
        "ongoing",
        "ended",
        "missed",
        "declined",
        "failed",
      ],
      default: "initiated",
    },
    initiator: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    participants: [CallParticipantSchema],
    conversation: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
    },
    isGroupCall: {
      type: Boolean,
      default: false,
    },
    startedAt: Date,
    endedAt: Date,
    duration: Number,
    metadata: {
      endReason: {
        type: String,
        enum: ["normal", "missed", "declined", "failed", "timeout"],
      },
    },
  },
  { timestamps: true },
);

CallSchema.index({ initiator: 1, createdAt: -1 });
CallSchema.index({ "participants.user": 1, createdAt: -1 });
CallSchema.index({ status: 1 });

export default model<ICall>("Call", CallSchema);
