import { Router } from "express";
import {
  deleteVideo,
  getAllVideos,
  getVideoById,
  publishVideo,
  togglePublishStatus,
  updateVideo,
} from "../controllers/video.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

// PUBLIC: list videos
router.route("/").get(getAllVideos);

// PROTECTED: everything below needs JWT
router.use(verifyJWT);

// create video
router.route("/").post(
  upload.fields([
    { name: "videoFile", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 },
  ]),
  publishVideo
);

// get / update / delete single video
router
  .route("/:videoId")
  .get(getVideoById)
  .delete(deleteVideo)
  .patch(
    upload.fields([{ name: "thumbnail", maxCount: 1 }]),
    updateVideo
  );

// toggle publish status
router.route("/toggle/publish/:videoId").patch(togglePublishStatus);

export default router;
