import z from "zod"


export const UserSchema = z.object({
    id: z.string().uuid().optional(),
    name: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(6),
    createdAt: z.date().optional(),
    updatedAt: z.date().optional()
})

export type UserSchematype = z.infer<typeof UserSchema>;

export const RoomSchema = z.object({
    id: z.string().uuid().optional(),
    name: z.string().min(8),
    createdAt: z.date().optional(),
    updatedAt: z.date().optional()
})

export type RoomSchematype = z.infer<typeof RoomSchema>

export const MessageSchema = z.object({
    id: z.string().uuid().optional(),
    content: z.string().min(1),
    userId: z.string().uuid(),
    roomId: z.string().uuid(),
    createdAt: z.date().optional()
})

export type MessageSchematype = z.infer<typeof MessageSchema>

export const RoomUserSchema = z.object({
    userId: z.string().uuid(),
    roomId: z.string().uuid()
})

export const SignInSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
});

export type SigninSchematype = z.infer<typeof SignInSchema>