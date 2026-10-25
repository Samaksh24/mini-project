import Complaint from '../models/complaitmodel.js'
import uploadToImageKit from "../utils/uploadtoImageKit.js";
import { analyzeComplaintImage } from '../utils/geminiService.js';

export const submitComplaint=async(req,res)=>{


 try{
    const{title,description,category,lat,lng}=req.body;
    const userId=req.user.id;

    const image=req.file;

    if(!title || !category || !image|| lng===undefined || lat===undefined){
        return res.status(400).json({
            message:"Title, category, latitude, longitude and image are required"
        });
    } 
    const latitude = Number(lat);
    const longitude = Number(lng);

    if (
    Number.isNaN(latitude) ||
    Number.isNaN(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
    ) {
        return res.status(400).json({
        message: "Invalid latitude or longitude"
     });
    }


    const duplicate = await Complaint.findOne({
        category: category,
        status: { $nin: ["Resolved", "Rejected"] },
        location: {
            $near: {
            $geometry: {
                type: "Point",
                coordinates: [longitude, latitude]
             },
              $maxDistance: 30
            }
          }
    });

    if (duplicate) {
      const updatedComplaint = await Complaint.findOneAndUpdate(
        {
            _id: duplicate._id,
            "reportedBy.userId": { $ne: userId }
        },
        {
            $push: {
                reportedBy: {
                    userId: userId
                }
            },
            $inc: {
                duplicateCount: 1
            }
        },
        {
            new: true
        }
     );

     if (!updatedComplaint) {
        return res.status(409).json({
            message: "You have already reported this complaint"
         });
     }

     return res.status(200).json({
        message: "Complaint already exists. Your report has been added.",
         complaint: updatedComplaint
     });
   }
      
   const imageUrl = await uploadToImageKit(
    image.buffer,
    image.originalname
   );

    const aiAnalysis = await analyzeComplaintImage(
    image.buffer,
    image.mimetype,
    category
   );


    const complaint = await Complaint.create({
        user: userId,
        image: imageUrl,
        title,
        description,
        category,
        location: {
        type: "Point",
        coordinates: [longitude, latitude]
        },
      aiAnalysis,
      reportedBy: [
        {
            userId: userId
        }
      ],
      duplicateCount: 1
    });

     return res.status(201).json({
      message: "Complaint submitted successfully",
     complaint
     });

    }catch(error){
        console.log("error occoured",error);
         return res.status(500).json({
            message: "Something went wrong"
        });
    }
}

/* ------------------------------------------------------------------ */
/*  ADDED FOR THE DASHBOARD                                           */
/* ------------------------------------------------------------------ */

// Priority 0-100: severity carries 70 points, extra duplicate reports carry up to 30.
//   severity 10, 1 report   -> 70  (Critical)
//   severity 8,  4 reports  -> 65  (High)
//   severity 5,  1 report   -> 35  (Medium)
const computePriority = (c) => {
    const severity = c.aiAnalysis?.severity ?? 5;
    const extraReports = Math.min(Math.max((c.duplicateCount || 1) - 1, 0), 10);
    return Math.round(Math.min(100, severity * 7 + extraReports * 3));
};

// GET /api/complaints?category=Road&status=Open
//   status: "Open" (default, hides Resolved/Rejected), "All", or an exact status
export const getComplaints = async (req, res) => {
    try {
        const { category, status = "Open" } = req.query;
        const filter = {};

        if (category && category !== "All") filter.category = category;

        if (status === "Open") filter.status = { $nin: ["Resolved", "Rejected"] };
        else if (status !== "All") filter.status = status;

        const docs = await Complaint.find(filter)
            .select("-reportedBy -user")
            .lean();

        const complaints = docs
            .map((c) => ({ ...c, priority: computePriority(c) }))
            .sort(
                (a, b) =>
                    b.priority - a.priority ||
                    new Date(b.createdAt) - new Date(a.createdAt)
            );

        return res.status(200).json({ complaints });
    } catch (error) {
        console.log("error occoured", error);
        return res.status(500).json({ message: "Could not load complaints" });
    }
};

// PATCH /api/complaints/:id/status   (Admin only)
export const updateComplaintStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const allowed = Complaint.schema.path("status").enumValues;

        if (!allowed.includes(status)) {
            return res.status(400).json({
                message: `Status must be one of: ${allowed.join(", ")}`
            });
        }

        const complaint = await Complaint.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        ).select("-reportedBy -user");

        if (!complaint) {
            return res.status(404).json({ message: "Complaint not found" });
        }

        return res.status(200).json({
            message: "Status updated",
            complaint: { ...complaint.toObject(), priority: computePriority(complaint) }
        });
    } catch (error) {
        console.log("error occoured", error);
        return res.status(500).json({ message: "Could not update status" });
    }
};



/* GET /api/complaints/mine — complaints associated with the logged-in user */

export const getMyComplaints = async (req, res) => {
    try {
        const userId = req.user.id;

        const docs = await Complaint.find({
            $or: [
                { user: userId },
                { "reportedBy.userId": userId }
            ]
        })
        .sort({ createdAt: -1 })
        .lean();

        const complaints = docs.map((c) => {
            const submittedByMe =
                c.user?.toString() === userId.toString();

            const { user, reportedBy, ...safeComplaint } = c;

            return {
                ...safeComplaint,
                submittedByMe,
                reportType: submittedByMe ? "Submitted by you" : "You joined this report",
                priority: computePriority(c)
            };
        });

        return res.status(200).json({ complaints });

    } catch (error) {
        console.error("Could not load my complaints:", error);

        return res.status(500).json({
            message: "Could not load your complaints"
        });
    }
};
