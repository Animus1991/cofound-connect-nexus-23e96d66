import { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { authPreHandler } from "../lib/auth.js";

const sendMessageSchema = z.object({
  content: z.string().min(1).max(5000),
});

const createConversationSchema = z.object({
  participantId: z.string().min(1),
});

export async function messagesRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authPreHandler);

  app.get("/conversations", async (request) => {
    const { userId } = request as FastifyRequest & { userId: string };

    const participants = await prisma.conversationParticipant.findMany({
      where: { userId },
      include: {
        conversation: {
          include: {
            participants: {
              include: {
                user: { select: { id: true, name: true } },
              },
            },
            messages: {
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
        },
      },
    });

    const conversations = participants.map((p) => {
      const other = p.conversation.participants.find((x) => x.userId !== userId);
      const lastMsg = p.conversation.messages[0];
      return {
        id: p.conversationId,
        otherUser: other?.user ?? null,
        lastMessage: lastMsg
          ? { content: lastMsg.content, createdAt: lastMsg.createdAt, fromMe: lastMsg.senderId === userId }
          : null,
      };
    });

    return { conversations };
  });

  app.post("/conversations", async (request, reply) => {
    const { userId } = request as FastifyRequest & { userId: string };
    const parseResult = createConversationSchema.safeParse(request.body);

    if (!parseResult.success) {
      return reply.status(400).send({
        error: "Validation failed",
        details: parseResult.error.flatten(),
      });
    }

    const { participantId } = parseResult.data;
    if (participantId === userId) {
      return reply.status(400).send({ error: "Cannot create conversation with yourself" });
    }

    const existing = await prisma.conversation.findFirst({
      where: {
        AND: [
          { participants: { some: { userId } } },
          { participants: { some: { userId: participantId } } },
        ],
      },
    });

    if (existing) {
      return reply.status(200).send({
        id: existing.id,
        existing: true,
      });
    }

    const conv = await prisma.conversation.create({
      data: {
        participants: {
          create: [
            { userId },
            { userId: participantId },
          ],
        },
      },
    });

    return reply.status(201).send({ id: conv.id, existing: false });
  });

  app.get("/conversations/:id", async (request, reply) => {
    const { userId } = request as FastifyRequest & { userId: string };
    const { id } = request.params as { id: string };

    const participant = await prisma.conversationParticipant.findFirst({
      where: { conversationId: id, userId },
    });
    if (!participant) {
      return reply.status(404).send({ error: "Conversation not found" });
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
        participants: { include: { user: { select: { id: true, name: true } } } },
        messages: {
          orderBy: { createdAt: "asc" },
          include: { sender: { select: { id: true, name: true } } },
        },
      },
    });

    if (!conversation) {
      return reply.status(404).send({ error: "Conversation not found" });
    }

    const other = conversation.participants.find((p) => p.userId !== userId);

    return {
      id: conversation.id,
      otherUser: other?.user ?? null,
      messages: conversation.messages.map((m) => ({
        id: m.id,
        content: m.content,
        senderId: m.senderId,
        senderName: m.sender.name,
        createdAt: m.createdAt,
        fromMe: m.senderId === userId,
      })),
    };
  });

  app.post("/conversations/:id/messages", async (request, reply) => {
    const { userId } = request as FastifyRequest & { userId: string };
    const { id } = request.params as { id: string };
    const parseResult = sendMessageSchema.safeParse(request.body);

    if (!parseResult.success) {
      return reply.status(400).send({
        error: "Validation failed",
        details: parseResult.error.flatten(),
      });
    }

    const participant = await prisma.conversationParticipant.findFirst({
      where: { conversationId: id, userId },
    });
    if (!participant) {
      return reply.status(404).send({ error: "Conversation not found" });
    }

    const msg = await prisma.message.create({
      data: {
        conversationId: id,
        senderId: userId,
        content: parseResult.data.content,
      },
      include: { sender: { select: { id: true, name: true } } },
    });

    return reply.status(201).send({
      id: msg.id,
      content: msg.content,
      senderId: msg.senderId,
      senderName: msg.sender.name,
      createdAt: msg.createdAt,
      fromMe: true,
    });
  });
}
