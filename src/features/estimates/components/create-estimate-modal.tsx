"use client";

import { ClipboardList } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  EstimateRequestFormFields,
  createEmptyIndustryFieldValues,
  type EstimateRequestAddressForm,
  type EstimateRequestCustomerForm,
  type EstimateRequestProjectForm,
} from "@/features/estimate-requests/components/estimate-request-form-fields";
import type { PublicEstimateRequestPageData } from "@/features/estimate-requests/server/public-service";
import { createInternalEstimateAction } from "@/features/estimates/server/actions";
import type { Locale } from "@/lib/locale";

interface CreateEstimateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: PublicEstimateRequestPageData;
  workspaceId: string;
  workspaceSlug: string;
  locale: Locale;
}

function createInitialFormState(fields: PublicEstimateRequestPageData["fields"]) {
  return {
    title: "",
    customer: {
      fullName: "",
      email: "",
      phone: "",
    } satisfies EstimateRequestCustomerForm,
    address: {
      streetAddress: "",
      city: "",
      postalCode: "",
      voivodeship: "",
    } satisfies EstimateRequestAddressForm,
    project: {
      preferredStartDate: "asap",
      description: "",
    } satisfies EstimateRequestProjectForm,
    industryFields: createEmptyIndustryFieldValues(fields),
  };
}

export function CreateEstimateModal({
  open,
  onOpenChange,
  formData,
  workspaceId,
  workspaceSlug,
  locale,
}: CreateEstimateModalProps) {
  const router = useRouter();
  const t = useTranslations("estimates.create");
  const tForm = useTranslations("estimateRequests");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [customer, setCustomer] = useState<EstimateRequestCustomerForm>({
    fullName: "",
    email: "",
    phone: "",
  });
  const [address, setAddress] = useState<EstimateRequestAddressForm>({
    streetAddress: "",
    city: "",
    postalCode: "",
    voivodeship: "",
  });
  const [project, setProject] = useState<EstimateRequestProjectForm>({
    preferredStartDate: "asap",
    description: "",
  });
  const [industryFields, setIndustryFields] = useState(() =>
    createEmptyIndustryFieldValues(formData.fields),
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    const initial = createInitialFormState(formData.fields);
    setTitle(initial.title);
    setCustomer(initial.customer);
    setAddress(initial.address);
    setProject(initial.project);
    setIndustryFields(initial.industryFields);
    setError(null);
  }, [open, formData.fields]);

  const canSubmit = project.description.trim().length >= 20;

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }

    setError(null);

    startTransition(async () => {
      const result = await createInternalEstimateAction({
        workspaceId,
        locale,
        title: title.trim() || undefined,
        customer,
        address,
        project: {
          preferredStartDate: project.preferredStartDate,
          description: project.description.trim(),
        },
        industryFields,
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      onOpenChange(false);
      router.push(
        `/${locale}/dashboard/${workspaceSlug}/estimates/${result.data.estimateId}`,
      );
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(90vh,880px)] w-[calc(100%-2rem)] max-w-[min(92vw,56rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-[min(92vw,56rem)]">
        <DialogHeader className="shrink-0 border-b px-6 py-5 text-left">
          <div className="flex items-start gap-3 pr-8">
            <div
              className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"
              aria-hidden
            >
              <ClipboardList className="size-5" strokeWidth={2} />
            </div>
            <div className="min-w-0 space-y-2">
              <DialogTitle className="text-xl font-bold tracking-normal text-foreground">
                {tForm("form.title")}
              </DialogTitle>
              <DialogDescription className="text-xs leading-5 text-muted-foreground">
                {tForm("form.description")}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            <EstimateRequestFormFields
              locale={locale}
              fields={formData.fields}
              showTitle
              title={title}
              onTitleChange={setTitle}
              customer={customer}
              onCustomerChange={setCustomer}
              address={address}
              onAddressChange={setAddress}
              project={project}
              onProjectChange={setProject}
              industryFields={industryFields}
              onIndustryFieldChange={(key, value) =>
                setIndustryFields((current) => ({ ...current, [key]: value }))
              }
              disabled={isPending}
            />
          </div>

          {error ? (
            <p className="shrink-0 px-6 pb-2 text-sm text-destructive">{error}</p>
          ) : null}

          <DialogFooter className="shrink-0 gap-3 border-t bg-muted/20 px-6 py-4 sm:gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={isPending || !canSubmit}>
              {isPending ? t("submitting") : t("submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
