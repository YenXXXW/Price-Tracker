import "dotenv/config";
import express, { NextFunction, Request, Response } from "express";
import categoroiesRoutes from "./routes/categories";
import productsRoutes from "./routes/products";
import userRoutes from "./routes/users";
import morgan from "morgan";
import createHttpError, { isHttpError } from "http-errors";
import helmet from "helmet";
import cors from "cors";
import session from "express-session";
import env from "./utils/validateEnv";
import MongoStore from "connect-mongo";
import { requiresAuth } from "./middleware/auth";

const app = express();

app.use(express.json());

app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));

app.use(morgan("dev"));

app.set("trust proxy", 1);

app.use(
  cors({
    origin: [
      "http://localhost:5173/",
      "https://price-list-yenxxxw.vercel.app/",
    ],
    optionsSuccessStatus: 200,
    credentials: true,
  })
);

app.use(
  session({
    secret: env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    name: "sessionId",
    cookie: {
      maxAge: 1000 * 60 * 60 * 48,
      httpOnly: env.isProduction ? true : false,
      secure: env.isProduction,
      sameSite: env.isProduction ? "none" : "lax",
    },

    rolling: true,
    store: MongoStore.create({
      mongoUrl: env.MONGO_URL,
    }),
  })
);

app.get("/", (req, res) => {
  res.json({ message: "this is pricelist app" });
});
app.use("/api/categories", requiresAuth, categoroiesRoutes);

app.use("/api/products", requiresAuth, productsRoutes);

app.use("/api/users", userRoutes);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((req, res, next) => {
  next(createHttpError(404, "End Point not found"));
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((error: unknown, req: Request, res: Response, next: NextFunction) => {
  console.error(error);
  let errorMessage = "An unknown error occured";
  let statusCode = 500;
  if (isHttpError(error)) {
    statusCode = error.status;
    errorMessage = error.message;
  }
  res.status(statusCode).json({ error: errorMessage });
});

export default app;
