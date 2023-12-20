import { Schema, model } from 'mongoose'

const subscriptionSchema = new Schema({
    subscriber : {
        type: Schema.Types.ObjectId, // one who is subscribing
        ref: "User"
    },
    channel : {
        type: Schema.Types.ObjectId, // one to whom is subscribed
        ref: "User"
    }
},{timestamps:true})

export const Subscription = model("Subsctiption",subscriptionSchema)