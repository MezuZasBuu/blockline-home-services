import type { ServiceSettings } from '../src/modules/configuration/schema';
// Synthetic test values deliberately differ from the illustrative business-plan price.
export const settings:ServiceSettings={
 customerPriceCents:17700,contractorPayoutCents:8300,maxVentLengthFeet:31,minimumMarginBps:3200,
 scope:'One standard residential vent; test configuration only.',zipCodes:['19103'],
 surcharges:[{code:'long_run',label:'Long run',amountCents:2700}],exclusions:['Commercial systems'],
 qualificationRules:[{field:'ventLengthFeet',operator:'greater_than',value:31,outcome:'surcharge',surchargeCode:'long_run'}],
 complianceRequirements:[{key:'general_liability',label:'Verified general liability insurance',required:true}],
 paymentPolicy:{mode:'collect_at_booking_charge_after_verification',consentVersion:'test-consent-v1'},
};
export const ids={
 admin:'30000000-0000-4000-8000-000000000001',dispatcher:'30000000-0000-4000-8000-000000000002',
 contractorUser:'30000000-0000-4000-8000-000000000003',otherUser:'30000000-0000-4000-8000-000000000004',
 customer:'40000000-0000-4000-8000-000000000001',property:'50000000-0000-4000-8000-000000000001',
 service:'10000000-0000-4000-8000-000000000001',config:'20000000-0000-4000-8000-000000000002',
 booking:'60000000-0000-4000-8000-000000000001',job:'70000000-0000-4000-8000-000000000001',
 contractor:'80000000-0000-4000-8000-000000000001',document:'90000000-0000-4000-8000-000000000001',
 assignment:'a0000000-0000-4000-8000-000000000001',
};
