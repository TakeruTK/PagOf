import { z } from 'zod';
export const categories=['Anillos','Aros','Collares','Pulseras','Otros'] as const;
export const pieceSchema=z.object({id:z.string().uuid().optional(),name:z.string().trim().min(2,'Escribe un nombre de al menos 2 caracteres.').max(100),category:z.enum(categories),kind:z.enum(['Producto','Trabajo']),description:z.string().trim().min(10,'Cuenta un poco más: al menos 10 caracteres.').max(4000),material:z.string().trim().max(150),price:z.number().int().min(0).max(100000000).nullable(),status:z.enum(['Borrador','Publicado']),availability:z.enum(['Disponible','Por encargo','Vendido']),images:z.array(z.object({url:z.string().regex(/^\/api\/photos\/[a-f0-9-]{36}$/),caption:z.string().max(200)})).min(1,'Agrega al menos una fotografía.').max(8)});
export type Piece=z.infer<typeof pieceSchema>&{id:string;updated?:string};
export const instagram='https://www.instagram.com/carolinaalfaroorfebreria/';
