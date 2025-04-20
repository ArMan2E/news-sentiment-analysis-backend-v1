import express from "express";
import  {getNewsByCategory}  from "../controller/newsCategoryRest";

const newsCategoryFromDbRouter = express.Router();

// From MongoDbRoute
newsCategoryFromDbRouter.get("/:category", getNewsByCategory);

export default newsCategoryFromDbRouter;