// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext, CurrentUser } from "./_core/context";
const mocks=vi.hoisted(()=>({from:vi.fn(),rpc:vi.fn()}));
vi.mock("./_core/supabase.js",()=>({withTenantSupabase:(_token:string,op:()=>unknown)=>op(),supabaseAdmin:mocks}));
import { importReviewRouter, importAdjustmentSchema } from "./importReview";
const org="d0000000-0000-4000-8000-000000000001",unit="d0000000-0000-4000-8000-000000000003",id="668700cd-b04b-4aca-baa6-6509d1fb5790";
const input={id,version:0,field:"B",value:"Nome corrigido",reason:"Conferido com o cadastro original"};
function caller(role:CurrentUser["role"]|null="owner"){
 return importReviewRouter.createCaller({user:role?{id,email:"test@example.invalid",name:null,displayName:null,phone:null,role,organizationId:org,unitId:unit}:null,accessToken:role?"test":null,req:{} as TrpcContext["req"],res:{} as TrpcContext["res"]});
}
function chain(result:any){const q:any={};for(const method of ["select","eq","maybeSingle","order","range"])q[method]=vi.fn(()=>q);q.then=(resolve:any)=>Promise.resolve(result).then(resolve);return q;}
beforeEach(()=>{vi.clearAllMocks();mocks.from.mockReturnValue(chain({data:{units:{is_active:true,organization_id:org}},error:null}));mocks.rpc.mockResolvedValue({data:1,error:null});});
describe("import administrative review",()=>{
 it("denies history of a foreign row",async()=>{mocks.from.mockReturnValueOnce(chain({data:{units:{is_active:true,organization_id:org}},error:null})).mockReturnValueOnce(chain({data:null,error:null}));await expect(caller().history({id})).rejects.toMatchObject({code:"NOT_FOUND"});expect(mocks.from).toHaveBeenCalledTimes(2);});
 it("filters the review by source sheet",async()=>{const q=chain({data:[],count:0,error:null});mocks.from.mockReturnValueOnce(chain({data:{units:{is_active:true,organization_id:org}},error:null})).mockReturnValueOnce(q);await caller().list({offset:0,sheet:"PETS"});expect(q.eq).toHaveBeenCalledWith("source_sheet","PETS");});
 it.each([null,"staff","manager","student"] as const)("blocks %s before database access",async role=>{
  await expect(caller(role).adjust(input)).rejects.toMatchObject({code:role?"FORBIDDEN":"UNAUTHORIZED"});expect(mocks.from).not.toHaveBeenCalled();expect(mocks.rpc).not.toHaveBeenCalled();
 });
 it.each(["admin","owner"] as const)("allows authorized %s with server actor",async role=>{
  expect(await caller(role).adjust(input)).toEqual({version:1});expect(mocks.rpc).toHaveBeenCalledWith("adjust_import_review",{p_actor:id,p_row:id,p_version:0,p_field:"B",p_value:input.value,p_reason:input.reason});
 });
 it("rejects a foreign unit",async()=>{mocks.from.mockReturnValue(chain({data:{units:{is_active:true,organization_id:"foreign"}},error:null}));await expect(caller().adjust(input)).rejects.toMatchObject({code:"FORBIDDEN"});expect(mocks.rpc).not.toHaveBeenCalled();});
 it("rejects missing access",async()=>{mocks.from.mockReturnValue(chain({data:null,error:null}));await expect(caller().adjust(input)).rejects.toMatchObject({code:"FORBIDDEN"});});
 it("reports optimistic concurrency without leaking provider errors",async()=>{mocks.rpc.mockResolvedValue({error:{code:"40001",message:"private"}});await expect(caller().adjust(input)).rejects.toMatchObject({code:"CONFLICT"});});
 it("requires reason and preserves explicit empty value",()=>{expect(importAdjustmentSchema.safeParse({...input,reason:" "}).success).toBe(false);expect(importAdjustmentSchema.parse({...input,value:""}).value).toBe("");});
 it("filters list by server organization/unit",async()=>{const q=chain({data:[],count:0,error:null});mocks.from.mockReturnValueOnce(chain({data:{units:{is_active:true,organization_id:org}},error:null})).mockReturnValueOnce(q);expect(await caller().list({offset:0})).toEqual({rows:[],total:0});expect(q.eq).toHaveBeenCalledWith("organization_id",org);expect(q.eq).toHaveBeenCalledWith("unit_id",unit);});
});
