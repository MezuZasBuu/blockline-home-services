import { z } from 'zod';
const key = z.string().regex(/^[a-z][a-z0-9_]{1,63}$/);
const money = z.number().int().min(0).max(100_000_000);
export const settingsSchema = z.strictObject({
  customerPriceCents: money.positive(),
  contractorPayoutCents: money,
  maxVentLengthFeet: z.number().positive().max(10000),
  minimumMarginBps: z.number().int().min(0).max(10000),
  scope: z.string().min(1).max(2000),
  zipCodes: z.array(z.string().regex(/^\d{5}$/)).min(1).max(100),
  surcharges: z.array(z.strictObject({ code: key, label: z.string().min(1).max(200), amountCents: money })),
  exclusions: z.array(z.string().min(1).max(500)),
  qualificationRules: z.array(z.strictObject({
    field: z.enum(['ventLengthFeet','termination','stacked','access','blockage','propertyType','unknown']),
    operator: z.enum(['equals','greater_than','unknown']), value: z.union([z.string(),z.number(),z.boolean()]),
    outcome: z.enum(['surcharge','manual_review','excluded']), surchargeCode: key.optional(),
  })),
  complianceRequirements: z.array(z.strictObject({ key, label: z.string().min(1).max(200), required: z.boolean() })).min(1),
  paymentPolicy: z.strictObject({
    mode: z.enum(['collect_at_booking_charge_after_verification','pay_after_verification','charge_at_booking']),
    consentVersion: z.string().min(1).max(100),
  }),
}).superRefine((s,ctx) => {
  const codes = new Set(s.surcharges.map(x=>x.code));
  if (codes.size!==s.surcharges.length) ctx.addIssue({code:'custom',message:'Duplicate surcharge codes'});
  if (new Set(s.complianceRequirements.map(x=>x.key)).size!==s.complianceRequirements.length)
    ctx.addIssue({code:'custom',message:'Duplicate compliance requirements'});
  for (const r of s.qualificationRules) {
    if (r.outcome==='surcharge' && (!r.surchargeCode || !codes.has(r.surchargeCode)))
      ctx.addIssue({code:'custom',message:'Surcharge rule requires a configured surcharge'});
  }
});
export const configurationInput = z.strictObject({
  serviceId: z.uuid(), effectiveAt: z.iso.datetime({offset:true}), settings: settingsSchema,
});
export type ServiceSettings = z.infer<typeof settingsSchema>;
