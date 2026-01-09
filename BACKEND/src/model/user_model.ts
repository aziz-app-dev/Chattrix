import { Schema, model } from "mongoose";
import type { UserProps } from "../../types.js";

const UserSchema =new Schema<UserProps> ({
    email:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
    },
    password:{
        type:String,
        required:true,
        trim:true,
    },
    name:{
        type:String,
        required:true,
        trim:true,
    },
    img:{
        type:String,
        required:false,
        default:"",
        trim:true,
    },
    create:{
        type:Date,
        default:Date.now(),
    },
    fcmTokens: [{
        token: { type: String, required: true },
        platform: { type: String, enum: ['android', 'ios'], required: true },
        createdAt: { type: Date, default: Date.now }
    }]
})

export default model<UserProps>("User", UserSchema);