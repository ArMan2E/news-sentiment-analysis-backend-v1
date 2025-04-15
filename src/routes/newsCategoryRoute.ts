import express from "express";
import { newsCategory } from "../controller/newsCategoryController";

const newsCategoryRouter = express.Router();

newsCategoryRouter.get("/:category", newsCategory);

export default newsCategoryRouter;