import type {
  RequestCard,
  RequestDetail,
} from "@/server/client-api/dto/v1/request/dto";

type RequestStatus = RequestCard["status"];

export type RequestCardInput = {
  id: string;
  requestNumber: string | null;
  status: RequestStatus;
  customerFullName: string | null;
  customerEmail: string | null;
  city: string | null;
  propertyType: string | null;
  attachmentCount: number;
  estimateId: string | null;
  estimateTitle: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type RequestDetailInput = {
  id: string;
  requestNumber: string | null;
  status: RequestStatus;
  projectDescription: string;
  attachmentCount: number;
  customerData: {
    fullName?: string | null;
    email?: string | null;
    phone?: string | null;
  } | null;
  address: {
    streetAddress?: string | null;
    city?: string | null;
    postalCode?: string | null;
    voivodeship?: string | null;
  } | null;
  estimate: { id: string; title: string | null } | null;
  industryFields: Array<{ key: string; label: string; value: string }>;
  createdAt: Date;
  updatedAt: Date;
};

/** Pure: workspace request list item -> RequestCard DTO. */
export function toRequestCard(item: RequestCardInput): RequestCard {
  return {
    id: item.id,
    requestNumber: item.requestNumber,
    status: item.status,
    customerFullName: item.customerFullName,
    customerEmail: item.customerEmail,
    city: item.city,
    propertyType: item.propertyType,
    attachmentCount: item.attachmentCount,
    estimateId: item.estimateId,
    estimateTitle: item.estimateTitle,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

/** Pure: workspace request detail -> RequestDetail DTO. */
export function toRequestDetail(item: RequestDetailInput): RequestDetail {
  return {
    id: item.id,
    requestNumber: item.requestNumber,
    status: item.status,
    projectDescription: item.projectDescription,
    attachmentCount: item.attachmentCount,
    customer: item.customerData
      ? {
          fullName: item.customerData.fullName ?? null,
          email: item.customerData.email ?? null,
          phone: item.customerData.phone ?? null,
        }
      : null,
    address: item.address
      ? {
          streetAddress: item.address.streetAddress ?? null,
          city: item.address.city ?? null,
          postalCode: item.address.postalCode ?? null,
          voivodeship: item.address.voivodeship ?? null,
        }
      : null,
    estimate: item.estimate,
    industryFields: item.industryFields,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}
