import express, { Application, Request, Response } from "express";
import cors from "cors";
import router from "./app/routes";
import globalErrorHandler from "./app/middlewares/globalErrorHandler";
import notFound from "./app/middlewares/notFound";
import cookieParser from 'cookie-parser';
import { PaymentController } from "./app/modules/payment/payment.controller";


const app: Application = express();

app.post(
    "/webhook",
    express.raw({ type: "application/json" }),
    PaymentController.handleStripeWebhookEvent
);

// Middlewares
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));
// app.use(cors({
//     origin: 'https://event-activites-client.vercel.app',
//     credentials: true
// }));
app.use(express.json()); // For JSON requests
app.use(cookieParser());
app.use(express.urlencoded({ extended: true })); // For form-data

// Routes
app.use("/api/v1", router);

// Root route
app.get("/", (req: Request, res: Response) => {
  res.send("Events & Activities API is running 🚀");
});

app.use(globalErrorHandler);

app.use(notFound);

export default app;
