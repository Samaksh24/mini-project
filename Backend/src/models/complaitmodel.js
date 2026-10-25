import mongoose from "mongoose";

const complaintSchema = new mongoose.Schema({

    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true,
    },

    image :{
        type:String,
        required:true,
    },
    
    title:{
        type:String,
        required:true,
    },

    description:{
        type:String,
        required:false,
    },
    category:{
        type:String,
        required:true,
        enum: [
    "Road",
    "Garbage",
    "Water",
    "Electricity",
    "Streetlight",
    "Traffic Signal",
    "Other"
        ]
    },

    location:{
      type:{
        type:String,
        enum:['Point'],
        required:true,
      },
      coordinates:{
        type:[Number],
        required:true
      }
    },

    aiAnalysis: {
    detectedIssue: String,
    category: String,
    severity: Number,
    confidence: Number,
    description: String
 },

 reportedBy:[
    {
         userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
         reportedAt: { type: Date, default: Date.now }
    }
 ],

 duplicateCount :{type:Number,default:1},

 status: {
    type: String,
    enum: [
        "Under Review",
        "Pending",
        "Resolved",
        "Rejected"
    ],
    default: "Under Review"
 },
 },
 {
    timestamps:true,
})
complaintSchema.index({ location: '2dsphere' });
const Complaint = mongoose.model("Complaint",complaintSchema);

export default Complaint;