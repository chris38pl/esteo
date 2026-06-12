"use client";

import { useCallback, useRef } from "react";

import { getValueAtPath, type FormFieldPath } from "@/features/voice-intake/lib/apply-field-sequence";
import type { MappedVoiceFormState } from "@/features/voice-intake/lib/map-extraction-to-form";
import {
  getBetweenFieldsPauseMs,
  getInstantFieldPauseMs,
  typewriterReveal,
} from "@/features/voice-intake/lib/typewriter-field-value";
import {
  buildVoiceApplySequence,
  createEmptyWorkingState,
  setValueAtPath,
  usesTypewriterEffect,
} from "@/features/voice-intake/lib/voice-form-apply-sequence";

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getFieldRoot(path: FormFieldPath): HTMLElement | null {
  return document.querySelector(`[data-voice-field="${path}"]`);
}

function getFieldInput(path: FormFieldPath): HTMLElement | null {
  const root = getFieldRoot(path);
  return root?.querySelector("input, textarea, select") ?? null;
}

function highlightField(path: FormFieldPath, typing: boolean) {
  const el = getFieldRoot(path);
  if (!el) return;

  el.classList.add("voice-apply-active");
  if (typing) {
    el.classList.add("voice-apply-typing");
    const input = getFieldInput(path);
    if (input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement) {
      input.focus({ preventScroll: true });
    }
  }
  el.scrollIntoView({ behavior: "smooth", block: "center" });
}

function unhighlightField(path: FormFieldPath) {
  const el = getFieldRoot(path);
  el?.classList.remove("voice-apply-active", "voice-apply-typing");
  getFieldInput(path)?.classList.remove("voice-apply-char");
}

function pulseFieldInput(path: FormFieldPath) {
  const input = getFieldInput(path);
  if (!input) return;

  input.classList.remove("voice-apply-char");
  void input.offsetWidth;
  input.classList.add("voice-apply-char");
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export type VoiceFormApplySetters = {
  setTitle?: (value: string) => void;
  setCustomer: (value: MappedVoiceFormState["customer"]) => void;
  setAddress: (value: MappedVoiceFormState["address"]) => void;
  setProject: (value: MappedVoiceFormState["project"]) => void;
  setIndustryFields: (
    value:
      | MappedVoiceFormState["industryFields"]
      | ((prev: MappedVoiceFormState["industryFields"]) => MappedVoiceFormState["industryFields"]),
  ) => void;
  getIndustryFields: () => MappedVoiceFormState["industryFields"];
};

function applyFieldValue(path: FormFieldPath, state: MappedVoiceFormState, setters: VoiceFormApplySetters) {
  const value = getValueAtPath(state, path);

  switch (path) {
    case "title":
      setters.setTitle?.(String(value ?? ""));
      break;
    case "address.streetAddress":
      setters.setAddress({ ...state.address, streetAddress: String(value ?? "") });
      break;
    case "address.city":
      setters.setAddress({ ...state.address, city: String(value ?? "") });
      break;
    case "address.postalCode":
      setters.setAddress({ ...state.address, postalCode: String(value ?? "") });
      break;
    case "address.voivodeship":
      setters.setAddress({ ...state.address, voivodeship: String(value ?? "") });
      break;
    case "customer.fullName":
      setters.setCustomer({ ...state.customer, fullName: String(value ?? "") });
      break;
    case "customer.email":
      setters.setCustomer({ ...state.customer, email: String(value ?? "") });
      break;
    case "customer.phone":
      setters.setCustomer({ ...state.customer, phone: String(value ?? "") });
      break;
    case "project.preferredStartDate":
      setters.setProject({
        ...state.project,
        preferredStartDate: String(value ?? "asap"),
      });
      break;
    case "project.description":
      setters.setProject({ ...state.project, description: String(value ?? "") });
      break;
    case "industryFields.property_type":
      setters.setIndustryFields((prev) => ({
        ...prev,
        property_type: value as string | number | boolean | null,
      }));
      break;
    case "industryFields.area_size":
      setters.setIndustryFields((prev) => ({
        ...prev,
        area_size: value as string | number | boolean | null,
      }));
      break;
    default:
      break;
  }
}

function applyAllFields(state: MappedVoiceFormState, setters: VoiceFormApplySetters) {
  if (state.title && setters.setTitle) {
    setters.setTitle(state.title);
  }
  setters.setCustomer(state.customer);
  setters.setAddress(state.address);
  setters.setProject(state.project);
  setters.setIndustryFields(state.industryFields);
}

export function useVoiceFormApply() {
  const applyingRef = useRef(false);

  const applyMappedState = useCallback(
    async (state: MappedVoiceFormState, setters: VoiceFormApplySetters) => {
      if (applyingRef.current) return;
      applyingRef.current = true;

      const reducedMotion = prefersReducedMotion();
      const sequence = buildVoiceApplySequence(state);

      if (reducedMotion || sequence.length === 0) {
        applyAllFields(state, setters);
        applyingRef.current = false;
        return;
      }

      const working = createEmptyWorkingState(state, setters.getIndustryFields);

      for (const path of sequence) {
        const target = getValueAtPath(state, path);
        const targetText = String(target ?? "");

        if (usesTypewriterEffect(path)) {
          highlightField(path, true);

          await typewriterReveal(
            path,
            targetText,
            (partial) => {
              setValueAtPath(working, path, partial);
              applyFieldValue(path, working, setters);
              pulseFieldInput(path);
            },
            () => pulseFieldInput(path),
          );

          unhighlightField(path);
        } else {
          highlightField(path, false);
          setValueAtPath(working, path, target as string | number | boolean | null);
          applyFieldValue(path, working, setters);
          await delay(getInstantFieldPauseMs());
          unhighlightField(path);
        }

        await delay(getBetweenFieldsPauseMs());
      }

      applyAllFields(state, setters);
      applyingRef.current = false;
    },
    [],
  );

  return { applyMappedState };
}
