import { Document,Types } from "mongoose";
export interface FcmTokenProps {
    token: string;
    platform: 'android' | 'ios';
    createdAt: Date;
}

export interface UserProps extends Document{
    email?:string;
    password?:string;
    name?:string;
    img?:string;
    create?:Date;
    fcmTokens?: FcmTokenProps[];
}

export interface ConvsersationPrps extends Document{
    _id:Types.ObjectId;
    type:"direct" | "group";
    participants?:Types.ObjectId[];
    lastMsg?:Types.ObjectId;
    createBy?:Types.ObjectId;
    createAt?:Date
    updateAt?:Date
    img?:string;

}

