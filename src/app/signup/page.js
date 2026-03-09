"use client";

import { useEffect, useState } from "react";
import { Alert, Button, Input, Select, Switch, message } from "antd";
import { PlusCircleFilled, StarFilled } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { useRegisterMutation } from "@/store/apiSlice";
import { getApiErrorMessage } from "@/utils/helpers";

const DEFAULT_REFERENCE_OPTIONS = {
  industries: [
    { value: "technology", label: "Technology" },
    { value: "manufacturing", label: "Manufacturing" },
    { value: "retail", label: "Retail" },
    { value: "healthcare", label: "Healthcare" },
    { value: "finance", label: "Finance" },
    { value: "education", label: "Education" },
    { value: "construction", label: "Construction" },
    { value: "real_estate", label: "Real Estate" },
    { value: "logistics", label: "Logistics & Supply Chain" },
    { value: "automotive", label: "Automotive" },
    { value: "hospitality", label: "Hospitality & Tourism" },
    { value: "telecommunications", label: "Telecommunications" },
    { value: "energy", label: "Energy & Utilities" },
    { value: "pharmaceuticals", label: "Pharmaceuticals" },
    { value: "agriculture", label: "Agriculture" },
    { value: "media", label: "Media & Entertainment" },
    { value: "ecommerce", label: "E-commerce" },
    { value: "consulting", label: "Consulting" },
    { value: "government", label: "Government & Public Sector" },
    { value: "nonprofit", label: "Non-Profit / NGO" },
    { value: "food_beverage", label: "Food & Beverage" },
    { value: "textile", label: "Textile & Apparel" },
    { value: "chemical", label: "Chemicals" },
    { value: "mining", label: "Mining & Metals" },
  ],
  countries: [
    { value: "India", label: "India" },
    { value: "United States", label: "United States" },
    { value: "United Kingdom", label: "United Kingdom" },
    { value: "United Arab Emirates", label: "United Arab Emirates" },
    { value: "Canada", label: "Canada" },
    { value: "Australia", label: "Australia" },
    { value: "Germany", label: "Germany" },
    { value: "France", label: "France" },
    { value: "Singapore", label: "Singapore" },
    { value: "Saudi Arabia", label: "Saudi Arabia" },
    { value: "Qatar", label: "Qatar" },
    { value: "South Africa", label: "South Africa" },
    { value: "Japan", label: "Japan" },
    { value: "China", label: "China" },
    { value: "Netherlands", label: "Netherlands" },
    { value: "Italy", label: "Italy" },
    { value: "Spain", label: "Spain" },
    { value: "Brazil", label: "Brazil" },
    { value: "Malaysia", label: "Malaysia" },
    { value: "New Zealand", label: "New Zealand" },
  ],
  states: [
    { value: "Andhra Pradesh", label: "Andhra Pradesh" },
    { value: "Arunachal Pradesh", label: "Arunachal Pradesh" },
    { value: "Assam", label: "Assam" },
    { value: "Bihar", label: "Bihar" },
    { value: "Chhattisgarh", label: "Chhattisgarh" },
    { value: "Goa", label: "Goa" },
    { value: "Gujarat", label: "Gujarat" },
    { value: "Haryana", label: "Haryana" },
    { value: "Himachal Pradesh", label: "Himachal Pradesh" },
    { value: "Jharkhand", label: "Jharkhand" },
    { value: "Karnataka", label: "Karnataka" },
    { value: "Kerala", label: "Kerala" },
    { value: "Madhya Pradesh", label: "Madhya Pradesh" },
    { value: "Maharashtra", label: "Maharashtra" },
    { value: "Manipur", label: "Manipur" },
    { value: "Meghalaya", label: "Meghalaya" },
    { value: "Mizoram", label: "Mizoram" },
    { value: "Nagaland", label: "Nagaland" },
    { value: "Odisha", label: "Odisha" },
    { value: "Punjab", label: "Punjab" },
    { value: "Rajasthan", label: "Rajasthan" },
    { value: "Sikkim", label: "Sikkim" },
    { value: "Tamil Nadu", label: "Tamil Nadu" },
    { value: "Telangana", label: "Telangana" },
    { value: "Tripura", label: "Tripura" },
    { value: "Uttar Pradesh", label: "Uttar Pradesh" },
    { value: "Uttarakhand", label: "Uttarakhand" },
    { value: "West Bengal", label: "West Bengal" },
  ],
  languages: [
    { value: "English", label: "English" },
    { value: "Hindi", label: "Hindi" },
    { value: "Spanish", label: "Spanish" },
    { value: "French", label: "French" },
    { value: "German", label: "German" },
    { value: "Arabic", label: "Arabic" },
    { value: "Chinese (Simplified)", label: "Chinese (Simplified)" },
    { value: "Chinese (Traditional)", label: "Chinese (Traditional)" },
    { value: "Japanese", label: "Japanese" },
    { value: "Portuguese", label: "Portuguese" },
    { value: "Russian", label: "Russian" },
    { value: "Italian", label: "Italian" },
    { value: "Dutch", label: "Dutch" },
    { value: "Korean", label: "Korean" },
    { value: "Tamil", label: "Tamil" },
    { value: "Telugu", label: "Telugu" },
    { value: "Bengali", label: "Bengali" },
    { value: "Marathi", label: "Marathi" },
    { value: "Urdu", label: "Urdu" },
    { value: "Turkish", label: "Turkish" },
  ],
  timeZones: [
    {
      value: "(GMT +5:30) India Standard Time (Asia/Kolkata)",
      label: "(GMT +5:30) India Standard Time (Asia/Kolkata)",
    },
    {
      value: "(GMT 0:00) Greenwich Mean Time (Europe/London)",
      label: "(GMT 0:00) Greenwich Mean Time (Europe/London)",
    },
    {
      value: "(GMT -5:00) Eastern Time (America/New_York)",
      label: "(GMT -5:00) Eastern Time (America/New_York)",
    },
    {
      value: "(GMT -8:00) Pacific Time (America/Los_Angeles)",
      label: "(GMT -8:00) Pacific Time (America/Los_Angeles)",
    },
    {
      value: "(GMT +4:00) Gulf Standard Time (Asia/Dubai)",
      label: "(GMT +4:00) Gulf Standard Time (Asia/Dubai)",
    },
    {
      value: "(GMT +1:00) Central European Time (Europe/Berlin)",
      label: "(GMT +1:00) Central European Time (Europe/Berlin)",
    },
    {
      value: "(GMT +8:00) Singapore Time (Asia/Singapore)",
      label: "(GMT +8:00) Singapore Time (Asia/Singapore)",
    },
    {
      value: "(GMT +9:00) Japan Standard Time (Asia/Tokyo)",
      label: "(GMT +9:00) Japan Standard Time (Asia/Tokyo)",
    },
    {
      value: "(GMT +8:00) China Standard Time (Asia/Shanghai)",
      label: "(GMT +8:00) China Standard Time (Asia/Shanghai)",
    },
    {
      value: "(GMT +10:00) Australian Eastern Time (Australia/Sydney)",
      label: "(GMT +10:00) Australian Eastern Time (Australia/Sydney)",
    },
    {
      value: "(GMT -3:00) Brasilia Time (America/Sao_Paulo)",
      label: "(GMT -3:00) Brasilia Time (America/Sao_Paulo)",
    },
    {
      value: "(GMT +12:00) New Zealand Standard Time (Pacific/Auckland)",
      label: "(GMT +12:00) New Zealand Standard Time (Pacific/Auckland)",
    },
    {
      value: "(GMT +3:00) Arabia Standard Time (Asia/Riyadh)",
      label: "(GMT +3:00) Arabia Standard Time (Asia/Riyadh)",
    },
    {
      value: "(GMT +2:00) South Africa Standard Time (Africa/Johannesburg)",
      label: "(GMT +2:00) South Africa Standard Time (Africa/Johannesburg)",
    },
  ],
  currencies: [
    { value: "INR - Indian Rupee", label: "INR - Indian Rupee" },
    { value: "USD - US Dollar", label: "USD - US Dollar" },
    {
      value: "GBP - British Pound Sterling",
      label: "GBP - British Pound Sterling",
    },
    { value: "AED - UAE Dirham", label: "AED - UAE Dirham" },
    { value: "CAD - Canadian Dollar", label: "CAD - Canadian Dollar" },
    { value: "AUD - Australian Dollar", label: "AUD - Australian Dollar" },
    { value: "EUR - Euro", label: "EUR - Euro" },
    { value: "SGD - Singapore Dollar", label: "SGD - Singapore Dollar" },
    { value: "SAR - Saudi Riyal", label: "SAR - Saudi Riyal" },
    { value: "QAR - Qatari Riyal", label: "QAR - Qatari Riyal" },
    { value: "ZAR - South African Rand", label: "ZAR - South African Rand" },
    { value: "JPY - Japanese Yen", label: "JPY - Japanese Yen" },
    { value: "CNY - Chinese Yuan", label: "CNY - Chinese Yuan" },
    { value: "BRL - Brazilian Real", label: "BRL - Brazilian Real" },
    { value: "MYR - Malaysian Ringgit", label: "MYR - Malaysian Ringgit" },
    { value: "NZD - New Zealand Dollar", label: "NZD - New Zealand Dollar" },
  ],
};

function firstValue(items) {
  return Array.isArray(items) && items[0]?.value ? items[0].value : undefined;
}

function hasValue(items, value) {
  return Array.isArray(items) && items.some((item) => item.value === value);
}

const selectSearchProps = {
  showSearch: true,
  listHeight: 360,
  virtual: false,
  optionFilterProp: "label",
  filterOption: (input, option) =>
    String(option?.label || "")
      .toLowerCase()
      .includes(String(input || "").toLowerCase()),
};

export default function SignupPage() {
  const router = useRouter();
  const [status, setStatus] = useState({ state: "idle", message: "" });
  const [showAddress, setShowAddress] = useState(true);
  const [messageApi, contextHolder] = message.useMessage();
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [registerUser] = useRegisterMutation();
  const [referenceOptions, setReferenceOptions] = useState(
    DEFAULT_REFERENCE_OPTIONS,
  );
  const [formValues, setFormValues] = useState({
    organizationName: "",
    industry: undefined,
    organizationLocation: "India",
    stateUnionTerritory: undefined,
    organizationAddress: "",
    email: "",
    password: "",
    gstNumber: "",
    currency: "INR - Indian Rupee",
    language: "English",
    timeZone: "(GMT 5:30) India Standard Time (Asia/Calcutta)",
    gstRegistered: false,
  });

  const updateField = (field, value) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    let ignore = false;

    async function loadReferenceData() {
      setOptionsLoading(true);
      try {
        const country = encodeURIComponent(
          formValues.organizationLocation || "India",
        );
        const res = await fetch(`/api/reference-data?country=${country}`, {
          method: "GET",
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error("Failed to fetch reference data");
        }

        const data = await res.json();
        if (ignore) return;

        const nextOptions = {
          industries:
            Array.isArray(data?.industries) && data.industries.length
              ? data.industries
              : DEFAULT_REFERENCE_OPTIONS.industries,
          countries:
            Array.isArray(data?.countries) && data.countries.length
              ? data.countries
              : DEFAULT_REFERENCE_OPTIONS.countries,
          states:
            Array.isArray(data?.states) && data.states.length
              ? data.states
              : DEFAULT_REFERENCE_OPTIONS.states,
          languages:
            Array.isArray(data?.languages) && data.languages.length
              ? data.languages
              : DEFAULT_REFERENCE_OPTIONS.languages,
          timeZones:
            Array.isArray(data?.timeZones) && data.timeZones.length
              ? data.timeZones
              : DEFAULT_REFERENCE_OPTIONS.timeZones,
          currencies:
            Array.isArray(data?.currencies) && data.currencies.length
              ? data.currencies
              : DEFAULT_REFERENCE_OPTIONS.currencies,
        };

        setReferenceOptions(nextOptions);
        setFormValues((prev) => ({
          ...prev,
          stateUnionTerritory: hasValue(
            nextOptions.states,
            prev.stateUnionTerritory,
          )
            ? prev.stateUnionTerritory
            : undefined,
          language: hasValue(nextOptions.languages, prev.language)
            ? prev.language
            : firstValue(nextOptions.languages),
          timeZone: hasValue(nextOptions.timeZones, prev.timeZone)
            ? prev.timeZone
            : firstValue(nextOptions.timeZones),
          currency: hasValue(nextOptions.currencies, prev.currency)
            ? prev.currency
            : firstValue(nextOptions.currencies),
        }));
      } catch (_error) {
        if (!ignore) {
          setReferenceOptions(DEFAULT_REFERENCE_OPTIONS);
        }
      } finally {
        if (!ignore) {
          setOptionsLoading(false);
        }
      }
    }

    loadReferenceData();
    return () => {
      ignore = true;
    };
  }, [formValues.organizationLocation]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (
      !String(formValues.organizationName || "").trim() ||
      !String(formValues.organizationAddress || "").trim() ||
      !String(formValues.email || "").trim() ||
      !String(formValues.password || "").trim() ||
      !formValues.organizationLocation ||
      !formValues.stateUnionTerritory ||
      !formValues.currency ||
      !formValues.language ||
      !formValues.timeZone
    ) {
      const errorMessage = "Please fill all required fields.";
      setStatus({ state: "error", message: errorMessage });
      messageApi.error(errorMessage);
      return;
    }

    if (formValues.gstRegistered && !String(formValues.gstNumber || "").trim()) {
      const errorMessage = "GST number is required when registered for GST.";
      setStatus({ state: "error", message: errorMessage });
      messageApi.error(errorMessage);
      return;
    }

    if (formValues.password.length < 8) {
      const errorMessage = "Password must be at least 8 characters long.";
      setStatus({ state: "error", message: errorMessage });
      messageApi.error(errorMessage);
      return;
    }

    try {
      setStatus({ state: "loading", message: "" });

      const payload = {
        name: String(formValues.organizationName || "New User").trim(),
        email: String(formValues.email || "").trim().toLowerCase(),
        password: formValues.password,
        companyName: String(formValues.organizationName || "").trim(),
        companyAddress: String(formValues.organizationAddress || "").trim(),
        isIndiaB2B: formValues.gstRegistered,
        gstNumber: formValues.gstRegistered
          ? String(formValues.gstNumber || "").trim().toUpperCase()
          : "",
        // No workspace at signup; workspace creation is a separate flow
      };

      const data = await registerUser(payload).unwrap();

      // Persist auth + workspace info
      window.localStorage.setItem("isAuthed", "true");
      window.localStorage.setItem("userId", data?.user?._id || "");
      window.localStorage.setItem("userEmail", data?.user?.email || "");
      window.localStorage.setItem("userName", data?.user?.name || "");
      if (data?.workspace?.workspaceId) {
        window.localStorage.setItem("workspaceId", data.workspace.workspaceId);
      }
      if (data?.workspace?.joinCode) {
        window.localStorage.setItem("joinCode", data.workspace.joinCode);
      }

      setStatus({
        state: "success",
        message: "Account created and workspace ready. Redirecting…",
      });
      messageApi.success("Signed up! Taking you to your workspace.");
      router.replace("/workspace");
    } catch (error) {
      const errorMessage = getApiErrorMessage(
        error,
        "Failed to save organization profile.",
      );
      setStatus({ state: "error", message: errorMessage });
      messageApi.error(errorMessage);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-6 sm:px-6 sm:py-10">
      {contextHolder}
      <div className="mx-auto w-full max-w-6xl">
        <div className="rounded border border-slate-200 bg-white p-5 shadow-sm sm:p-8 md:p-10">
          <div className="mb-10 text-center">
            <h1 className="text-3xl font-medium text-slate-900">
              Set up your organization profile
            </h1>
            <div className="mx-auto mt-4 h-[3px] w-8 rounded-full bg-blue-500" />
          </div>

          <form className="space-y-10" onSubmit={handleSubmit}>
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
                Organizational Details
              </h2>

              <div className="mt-6 space-y-5">
                <div>
                  <label className="mb-2 block text-base font-medium text-slate-800">
                    Organization Name<span className="text-red-500">*</span>
                  </label>
                  <Input
                    size="large"
                    value={formValues.organizationName}
                    onChange={(e) =>
                      updateField("organizationName", e.target.value)
                    }
                    placeholder="Enter organization name"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-base font-medium text-slate-800">
                    Industry
                  </label>
                  <Select
                    size="large"
                    value={formValues.industry}
                    onChange={(value) => updateField("industry", value)}
                    placeholder="Select industry"
                    options={referenceOptions.industries}
                    loading={optionsLoading}
                    className="w-full"
                    {...selectSearchProps}
                  />
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-base font-medium text-slate-800">
                      Organization Location
                      <span className="text-red-500">*</span>
                    </label>
                    <Select
                      size="large"
                      value={formValues.organizationLocation}
                      onChange={(value) =>
                        setFormValues((prev) => ({
                          ...prev,
                          organizationLocation: value,
                          stateUnionTerritory: undefined,
                        }))
                      }
                      options={referenceOptions.countries}
                      loading={optionsLoading}
                      className="w-full"
                      {...selectSearchProps}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-base font-medium text-slate-800">
                      State/Union Territory
                      <span className="text-red-500">*</span>
                    </label>
                    <Select
                      size="large"
                      value={formValues.stateUnionTerritory}
                      onChange={(value) =>
                        updateField("stateUnionTerritory", value)
                      }
                      placeholder="State/Union Territory"
                      options={referenceOptions.states}
                      loading={optionsLoading}
                      className="w-full"
                      {...selectSearchProps}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  className="inline-flex items-center gap-2 text-base font-semibold text-blue-600 hover:text-blue-700"
                  onClick={() => setShowAddress((prev) => !prev)}
                >
                  <PlusCircleFilled />
                  Add Organization Address
                </button>

                {showAddress && (
                  <Input.TextArea
                    rows={3}
                    required
                    value={formValues.organizationAddress}
                    onChange={(e) =>
                      updateField("organizationAddress", e.target.value)
                    }
                    placeholder="Enter organization address"
                  />
                )}
              </div>
            </section>

            <section>
              <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
                Account Access
              </h2>

              <div className="mt-6 grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-base font-medium text-slate-800">
                    Work Email<span className="text-red-500">*</span>
                  </label>
                  <Input
                    size="large"
                    type="email"
                    value={formValues.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    placeholder="you@company.com"
                    required
                    autoComplete="email"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-base font-medium text-slate-800">
                    Create Password<span className="text-red-500">*</span>
                  </label>
                  <Input.Password
                    size="large"
                    value={formValues.password}
                    onChange={(e) => updateField("password", e.target.value)}
                    placeholder="Choose a strong password"
                    required
                    autoComplete="new-password"
                  />
                </div>
              </div>
              <p className="mt-2 text-sm text-slate-500">
                We will create your login using this email and password.
              </p>
            </section>

            <section>
              <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
                Regional Settings
              </h2>

              <div className="mt-6 space-y-5">
                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-base font-medium text-slate-800">
                      Currency<span className="text-red-500">*</span>
                    </label>
                    <Select
                      size="large"
                      value={formValues.currency}
                      onChange={(value) => updateField("currency", value)}
                      options={referenceOptions.currencies}
                      loading={optionsLoading}
                      className="w-full"
                      {...selectSearchProps}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-base font-medium text-slate-800">
                      Language<span className="text-red-500">*</span>
                    </label>
                    <Select
                      size="large"
                      value={formValues.language}
                      onChange={(value) => updateField("language", value)}
                      options={referenceOptions.languages}
                      loading={optionsLoading}
                      className="w-full"
                      {...selectSearchProps}
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-base font-medium text-slate-800">
                    Time Zone<span className="text-red-500">*</span>
                  </label>
                  <Select
                    size="large"
                    value={formValues.timeZone}
                    onChange={(value) => updateField("timeZone", value)}
                    options={referenceOptions.timeZones}
                    loading={optionsLoading}
                    className="w-full"
                    {...selectSearchProps}
                  />
                </div>
              </div>
            </section>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
              <span className="text-base text-slate-900">
                Is this business registered for GST?
              </span>
              <div className="flex items-center gap-3">
                <span className="text-base text-slate-700">
                  {formValues.gstRegistered ? "Yes" : "No"}
                </span>
                <Switch
                  checked={formValues.gstRegistered}
                  onChange={(checked) => updateField("gstRegistered", checked)}
                />
              </div>
            </div>

            {formValues.gstRegistered && (
              <div>
                <label className="mb-2 block text-base font-medium text-slate-800">
                  GST Number<span className="text-red-500">*</span>
                </label>
                <Input
                  size="large"
                  value={formValues.gstNumber}
                  onChange={(e) => updateField("gstNumber", e.target.value)}
                  placeholder="Enter GST number"
                  required
                />
              </div>
            )}

            <div className="border-y border-slate-200 py-8">
              <p className="text-base font-semibold text-slate-700">Note:</p>
              <ul className="mt-4 list-disc space-y-3 pl-5 text-base text-slate-600">
                <li>
                  You can update some of these preferences from Settings
                  anytime.
                </li>
                <li>
                  The language you select on this page will be the default
                  language for the following features even if you change the
                  language later:
                </li>
              </ul>

              <div className="mt-6 grid gap-3 text-base text-slate-600 sm:grid-cols-3">
                <div className="flex items-center gap-2">
                  <StarFilled className="text-orange-400" />
                  Chart of Accounts
                </div>
                <div className="flex items-center gap-2">
                  <StarFilled className="text-orange-400" />
                  Email Templates
                </div>
                <div className="flex items-center gap-2">
                  <StarFilled className="text-orange-400" />
                  Template Customizations
                </div>
                <div className="flex items-center gap-2">
                  <StarFilled className="text-orange-400" />
                  Payment Modes
                </div>
              </div>
            </div>

            {status.message && (
              <Alert
                showIcon
                type={status.state === "error" ? "error" : "success"}
                message={status.message}
              />
            )}

            <div className="flex flex-col gap-4 pt-1 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  loading={status.state === "loading"}
                >
                  {status.state === "loading" ? "Saving..." : "Get Started"}
                </Button>
                <Button size="large" onClick={() => router.back()}>
                  Go Back
                </Button>
              </div>

              <a
                href="/privacy-policy"
                className="text-lg text-slate-600 underline underline-offset-2 hover:text-slate-800 sm:text-base"
              >
                Privacy Policy
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
