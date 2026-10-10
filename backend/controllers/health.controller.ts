import type { Request, Response } from "express";

export const getHealth = (req: Request, res: Response) => {
    try {
        console.log("health controller called");
        return res.json({
            message: "success",
            status: 200
        })
    } catch (err) {
        console.error("Error in health controller", err);
        return res.json({
            message: "error",
            status: 500
        })
    }
}