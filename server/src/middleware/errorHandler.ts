import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction) {
  if (err instanceof ApiError) {
    return res.status(err.status).json({ message: err.message });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      message: "Validation error",
      errors: err.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
    });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      return res.status(409).json({ message: `Duplicate value for field(s): ${(err.meta?.target as string[])?.join(", ")}` });
    }
    if (err.code === "P2025") {
      return res.status(404).json({ message: "Record not found" });
    }
    if (err.code === "P2003") {
      return res.status(409).json({ message: "Referenced record does not exist or is in use" });
    }
  }

  console.error(err);
  return res.status(500).json({ message: "Internal server error" });
}
