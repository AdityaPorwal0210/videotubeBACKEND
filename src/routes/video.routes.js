import { Router } from "express";
import {
  deleteVideo,
  getAllVideos,
  getVideoById,
  publishVideo,      // <-- make sure controller exports publishVideo
  togglePublishStatus,
  updateVideo,
} from "../controllers/video.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

// protect all video routes
router.use(verifyJWT);

// GET /videos , POST /videos
router
  .route("/")
  .get(getAllVideos)
  .post(
    upload.fields([
      {
        name: "videoFile",
        maxCount: 1,
      },
      {
        name: "thumbnail",
        maxCount: 1,
      },
    ]),
    publishVideo
  );

// GET /videos/:videoId , DELETE /videos/:videoId , PATCH /videos/:videoId
router
  .route("/:videoId")
  .get(getVideoById)
  .delete(deleteVideo)
  .patch(
    upload.fields([
      {
        name: "thumbnail",
        maxCount: 1,
      },
    ]),
    updateVideo
  );

// PATCH /videos/toggle/publish/:videoId
router.route("/toggle/publish/:videoId").patch(togglePublishStatus);

export default router;
