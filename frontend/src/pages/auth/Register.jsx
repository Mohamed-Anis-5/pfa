import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../../api/axios";
import AuthShell from "../../components/shared/AuthShell";

const ROLE_OPTIONS = [
  { value: "ROLE_CITIZEN", label: "Citizen" },
  { value: "ROLE_AGENT", label: "Municipal Agent" },
  { value: "ROLE_ADMIN", label: "Administrator" },
];

const GOVERNORATE_OPTIONS = [
  "TUNIS", "ARIANA", "BEN_AROUS", "MANOUBA", "NABEUL", "ZAGHOUAN",
  "BIZERTE", "BEJA", "JENDOUBA", "LE_KEF", "SILIANA", "SOUSSE",
  "MONASTIR", "MAHDIA", "SFAX", "KAIROUAN", "KASSERINE", "SIDI_BOUZID",
  "GABES", "MEDENINE", "TATAOUINE", "GAFSA", "TOZEUR", "KEBILI",
];

const SERVICE_TYPE_OPTIONS = ["Voirie", "Eclairage", "Assainissement", "Espaces_Verts"];
const GRADE_OPTIONS = ["Cat_A", "Cat_B", "Cat_C"];

const CITIZEN_FIELDS = {
  numCin: "",
  identifiantUnique: "",
  address: "",
  governorate: "",
  dateOfBirth: "",
};

const AGENT_FIELDS = {
  matricule: "",
  serviceType: "",
  grade: "",
  arrondissement: "",
};

const INITIAL_FORM = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  phoneNumber: "",
  role: "ROLE_CITIZEN",
  ...CITIZEN_FIELDS,
  ...AGENT_FIELDS,
};

const registerHighlights = [
  {
    title: "Citizen-friendly onboarding",
    text: "Residents can create an account, report an issue, and follow updates without friction.",
  },
  {
    title: "Clear identifiers for staff",
    text: "Agents and administrators register with role-specific identifiers and structured profile data.",
  },
  {
    title: "Built around real complaint handling",
    text: "The account flow leads directly into location capture, assignment, and feedback workflows.",
  },
];

function formatEnumLabel(value) {
  return value
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase())
    .join(" ");
}

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState(INITIAL_FORM);
  const [error, setError] = useState("");

  const isCitizen = form.role === "ROLE_CITIZEN";
  const isAgent = form.role === "ROLE_AGENT";
  const isAdmin = form.role === "ROLE_ADMIN";

  const setFieldValue = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleRoleChange = (nextRole) => {
    setError("");
    setForm((current) => {
      if (nextRole === "ROLE_CITIZEN") {
        return { ...current, role: nextRole, ...AGENT_FIELDS };
      }
      if (nextRole === "ROLE_AGENT") {
        return { ...current, role: nextRole, ...CITIZEN_FIELDS };
      }
      return { ...current, role: nextRole, ...CITIZEN_FIELDS, ...AGENT_FIELDS };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const payload = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        password: form.password,
        phoneNumber: form.phoneNumber.trim(),
        role: form.role,
        numCin: isCitizen ? form.numCin.trim() : null,
        identifiantUnique: (isCitizen || isAdmin) ? (form.identifiantUnique.trim() || null) : null,
        address: isCitizen ? (form.address.trim() || null) : null,
        governorate: isCitizen ? (form.governorate || null) : null,
        dateOfBirth: isCitizen ? (form.dateOfBirth || null) : null,
        matricule: isAgent ? (form.matricule.trim() || null) : null,
        serviceType: isAgent ? (form.serviceType || null) : null,
        arrondissement: isAgent ? (form.arrondissement.trim() || null) : null,
        grade: isAgent ? (form.grade || null) : null,
      };
      await api.post("/auth/register", payload);
      navigate("/login");
    } catch (err) {
      const apiMessage =
        err.response?.data?.message ||
        (typeof err.response?.data === "string" ? err.response.data : "");
      setError(apiMessage || "Registration failed");
    }
  };

  const field = (label, key, type = "text", options = {}) => {
    const { required: isRequired = true, ...inputProps } = options;
    const inputId = `register-${key}`;
    return (
      <div>
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1">
          {label}{!isRequired && <span className="text-gray-400 text-xs ml-1">(optional)</span>}
        </label>
        <input
          id={inputId}
          name={key}
          type={type}
          required={isRequired}
          className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={form[key]}
          onChange={e => setFieldValue(key, e.target.value)}
          {...inputProps}
        />
      </div>
    );
  };

  const selectField = (label, key, choices, options = {}) => {
    const {
      required: isRequired = true,
      placeholder = `Select ${label.toLowerCase()}`,
    } = options;
    const inputId = `register-${key}`;

    return (
      <div>
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1">
          {label}{!isRequired && <span className="text-gray-400 text-xs ml-1">(optional)</span>}
        </label>
        <select
          id={inputId}
          name={key}
          required={isRequired}
          className="w-full border rounded-lg px-3 py-2"
          value={form[key]}
          onChange={e => setFieldValue(key, e.target.value)}
        >
          <option value="">{placeholder}</option>
          {choices.map((choice) => (
            <option key={choice.value} value={choice.value}>{choice.label}</option>
          ))}
        </select>
      </div>
    );
  };

  return (
    <AuthShell
      eyebrow="Account creation"
      title="Create the right account for reporting, field work, or municipal oversight."
      description="The registration flow adapts to each role so citizen reporting stays simple while staff onboarding stays structured."
      highlights={registerHighlights}
      footer={(
        <p className="mt-6 text-sm text-[#5e746d]">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-[#16372d] hover:text-[#0f4f41]">
            Sign in instead
          </Link>
        </p>
      )}
    >
      <div className="space-y-6">
        <div>
          <p className="civic-kicker">Join the platform</p>
          <h2 className="mt-3 text-4xl tracking-[-0.04em] text-[#16372d]">Create your account</h2>
          <p className="mt-3 text-sm leading-7 text-[#5d736b]">
            Choose the role that matches how you interact with complaints, then complete the fields required for that role.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" aria-describedby={error ? "register-error" : undefined}>
          <div className="grid gap-4 sm:grid-cols-2">
            {field("First Name", "firstName")}
            {field("Last Name",  "lastName")}
          </div>
          {field("Email", "email", "email", { autoComplete: "email", placeholder: "you@municipality.tn" })}
          {field("Password", "password", "password", { minLength: 8, title: "Password must be at least 8 characters", autoComplete: "new-password", placeholder: "Create a strong password" })}
          {field("Phone Number", "phoneNumber", "text", {
            inputMode: "numeric",
            pattern: "[0-9]{8}",
            minLength: 8,
            maxLength: 8,
            title: "Phone number must contain exactly 8 digits",
            placeholder: "8-digit phone number"
          })}

          <div className="civic-field">
            <label htmlFor="register-role">Role</label>
            <select
              id="register-role"
              name="role"
              value={form.role}
              onChange={e => handleRoleChange(e.target.value)}
            >
              {ROLE_OPTIONS.map((roleOption) => (
                <option key={roleOption.value} value={roleOption.value}>{roleOption.label}</option>
              ))}
            </select>
          </div>

          {isCitizen && (
            <>
              {field("CIN Number (8 digits)", "numCin", "text", {
                inputMode: "numeric",
                pattern: "[0-9]{8}",
                minLength: 8,
                maxLength: 8,
                title: "CIN must contain exactly 8 digits",
                placeholder: "Citizen CIN"
              })}
              {field("Identifiant Unique (11 digits)", "identifiantUnique", "text", {
                required: false,
                inputMode: "numeric",
                pattern: "[0-9]{11}",
                minLength: 11,
                maxLength: 11,
                title: "Identifiant unique must contain exactly 11 digits",
                placeholder: "Optional citizen identifier"
              })}
              {field("Address", "address", "text", { required: false, placeholder: "Street or neighbourhood" })}
              {selectField(
                "Governorate",
                "governorate",
                GOVERNORATE_OPTIONS.map((value) => ({ value, label: formatEnumLabel(value) })),
                { required: false }
              )}
              {field("Date of Birth", "dateOfBirth", "date", { required: false })}
            </>
          )}

          {isAdmin && field("Unique Identifier", "identifiantUnique", "text", { placeholder: "Administrative identifier" })}

          {isAgent && (
            <>
              {field("Unique Identifier", "matricule", "text", { placeholder: "Agent field identifier" })}
              {selectField(
                "Service Type",
                "serviceType",
                SERVICE_TYPE_OPTIONS.map((value) => ({ value, label: formatEnumLabel(value) }))
              )}
              {selectField(
                "Grade",
                "grade",
                GRADE_OPTIONS.map((value) => ({ value, label: formatEnumLabel(value) }))
              )}
              {field("Arrondissement", "arrondissement", "text", { placeholder: "Assigned area" })}
            </>
          )}

          {error && <p id="register-error" role="alert" className="civic-alert">{error}</p>}
          <button type="submit" className="civic-button-primary w-full">
            Create Account
          </button>
        </form>
      </div>
    </AuthShell>
  );
}