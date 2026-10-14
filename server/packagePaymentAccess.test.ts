// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext, CurrentUser } from "./_core/context";
import { packageForRole } from "../shared/packagePaymentAccess";
const mock=vi.hoisted(()=>({from:vi.fn()}));
vi.mock("./_core/supabase.js",()=>({withTenantSupabase:(_token:string,op:()=>unknown)=>op(),supabase:{from:mock.from},supabaseAdmin:{from:mock.from}}));
import { appRouter } from "./routers";
const id="d0000000-0000-4000-8000-000000000003";
const record={id,code:"TEST",contracted_baths:4,balance_baths:4,contracted_groomings:0,balance_groomings:0,price:100,payment_status:"paid",payment_method:"PIX",payment_date:"2026-10-14",status:"active",frequency:"weekly"};
function caller(role:CurrentUser["role"]="staff"){return appRouter.createCaller({user:{id,email:"test@example.invalid",name:null,displayName:null,phone:null,role,organizationId:id,unitId:id},accessToken:"mock",req:{} as TrpcContext["req"],res:{} as TrpcContext["res"]});}
beforeEach(()=>{vi.clearAllMocks();const q:any={};for(const m of ["select","eq","order"])q[m]=()=>q;q.then=(resolve:any)=>Promise.resolve({data:[record],error:null}).then(resolve);mock.from.mockReturnValue(q);});
describe("package payments role boundary",()=>{
 it.each(["staff","student",null,"unknown"])("redacts for %s without changing source",role=>{const visible=packageForRole(record,role);expect(visible).not.toHaveProperty("payment_status");expect(visible).not.toHaveProperty("payment_method");expect(visible).not.toHaveProperty("payment_date");expect(visible.price).toBe(100);expect(record.payment_status).toBe("paid");});
 it.each(["owner","admin","manager"])("keeps payments for %s",role=>expect(packageForRole(record,role).payment_status).toBe("paid"));
 it("redacts both list and by-client API",async()=>{expect((await caller().clientPackages.list())[0]).not.toHaveProperty("payment_status");expect((await caller().clientPackages.byClient({clientId:id}))[0]).not.toHaveProperty("payment_method");});
 it.each([{paymentStatus:"paid" as const},{paymentStatus:"waived" as const},{paymentStatus:"pending" as const,paymentMethod:"PIX"},{paymentStatus:"pending" as const,paymentDate:"2026-10-14"}])("blocks staff payment input before database access",async fields=>{await expect(caller().clientPackages.create({clientId:id,petId:id,baths:1,groomings:0,price:100,...fields})).rejects.toMatchObject({code:"FORBIDDEN"});expect(mock.from).not.toHaveBeenCalled();});
});
