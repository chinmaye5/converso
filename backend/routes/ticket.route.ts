
import { Router } from "express";
import {
    createTicket,
    listTickets,
    updateTicketStatus,
} from "../controllers/ticket.controller";

const router = Router({ mergeParams: true });

router.post("/", createTicket);
router.get("/", listTickets);
router.patch("/:ticketId/status", updateTicketStatus);

export default router;
