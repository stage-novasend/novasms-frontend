import { z } from 'zod';

export const RegisterSchema = z.object({
  nom: z.string().min(2, 'Le nom complet doit contenir au moins 2 caractères'),
  email: z.string().email('Adresse email professionnelle invalide'),
  motDePasse: z.string().min(8, 'Minimum 8 caractères requis'),
  nomBoutique: z.string().min(2, 'Le nom de la boutique est requis'),
  pays: z.string().min(2, 'Le pays est requis'),
});

export type RegisterDto = z.infer<typeof RegisterSchema>;
