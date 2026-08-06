"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const LEGACY_LOCATION = "Tampa, Florida or Remote";
const GENERIC_LOCATION_PLACEHOLDER = "City, state, country, or Remote";
const LEGACY_TITLE_PLACEHOLDER = "Director, Loan Operations\nVP, Construction Lending";
const GENERIC_TITLE_PLACEHOLDER = "Target role title\nAnother target role";

function setControlledValue(
  element: HTMLInputElement | HTMLTextAreaElement,
  value: string,
) {
  const prototype = element instanceof HTMLInputElement
    ? HTMLInputElement.prototype
    : HTMLTextAreaElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;
  setter?.call(element, value);
  element.dispatchEvent(new Event("input", { bubbles: true }));
}

export function LegacyPersonalDefaultsGuard() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname !== "/jobs") return;

    if (
      window.localStorage.getItem("careeros-search-location")
      === LEGACY_LOCATION
    ) {
      window.localStorage.removeItem("careeros-search-location");
    }

    function sanitizeJobSearch() {
      const locationInput = Array.from(
        document.querySelectorAll<HTMLInputElement>("input"),
      ).find(
        (element) =>
          element.placeholder === LEGACY_LOCATION
          || element.dataset.legacyPersonalDefault === "location",
      );

      if (locationInput) {
        locationInput.dataset.legacyPersonalDefault = "location";
        locationInput.placeholder = GENERIC_LOCATION_PLACEHOLDER;
        if (locationInput.value === LEGACY_LOCATION) {
          setControlledValue(locationInput, "");
        }
      }

      const titleInput = Array.from(
        document.querySelectorAll<HTMLTextAreaElement>("textarea"),
      ).find(
        (element) =>
          element.placeholder === LEGACY_TITLE_PLACEHOLDER
          || element.dataset.legacyPersonalDefault === "titles",
      );

      if (titleInput) {
        titleInput.dataset.legacyPersonalDefault = "titles";
        titleInput.placeholder = GENERIC_TITLE_PLACEHOLDER;
      }
    }

    const timers = [0, 50, 150, 350, 750].map((delay) =>
      window.setTimeout(sanitizeJobSearch, delay),
    );

    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [pathname]);

  return null;
}
