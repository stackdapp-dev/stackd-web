"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loading } from "@/components/ui/loading";
import Modal from "@/components/ui/modal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addUserPaymentMethod, UserPaymentMethodInput } from "@/lib/api/user";
import { useUser } from "@/providers/UserProvider";
import { useWithdrawOTC } from "@/providers/WithrawOTCProvider";
import { useForm } from "@tanstack/react-form";
import { useRouter } from "next/navigation";
import * as z from "zod";

const formSchema = z.object({
  provider: z.string().min(1, "Provider must not be empty"),
  accountName: z
    .string()
    .min(3, "Account name must be at least 3 characters.")
    .max(255, "Account name must be at most 255 characters."),
  email: z.string().email("Invalid email address"),
  phoneNumber: z
    .string()
    .min(11, "Phone number must be at least 11 characters.")
    .max(13, "Phone number must be at most 13 characters."),
  alias: z.string().optional(),
});

const defaultValues: {
  provider: string;
  accountName: string;
  email: string;
  phoneNumber: string;
  alias?: string | undefined;
} = {
  provider: "",
  accountName: "",
  email: "",
  phoneNumber: "",
  alias: undefined,
};

const AddEWallet = () => {
  const { getAccessToken, refetchPaymentMethods } = useUser();
  const router = useRouter();
  const { setPaymentMethod } = useWithdrawOTC();

  const [isLoading, setIsLoading] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  const form = useForm({
    defaultValues,
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: async ({ value }) => {
      const { provider, ...rest } = value;
      const payload: UserPaymentMethodInput = {
        ...rest,
        bankName: provider,
        type: "e-wallet",
      };

      if (isFavorite) {
        const accessToken = await getAccessToken();
        if (!accessToken) return;

        setIsLoading(true);
        const paymentMethodId = await addUserPaymentMethod(
          accessToken,
          payload
        );

        if (paymentMethodId) {
          // use payment method id only
          setPaymentMethod(paymentMethodId);
          await refetchPaymentMethods();
          setIsLoading(false);
        } else {
          setIsLoading(false);
        }
      } else {
        // use entire payment method details
        setPaymentMethod(payload);
      }

      router.push("/withdraw/otc/review");
    },
  });

  return (
    <div>
      <form
        id="add-payment-method-form"
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
      >
        <FieldGroup>
          <form.Field
            name="provider"
            children={(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field className="gap-1" data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Provider</FieldLabel>
                  <Select
                    name={field.name}
                    value={field.state.value}
                    onValueChange={(e) => field.handleChange(e)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your provider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gcash">GCash</SelectItem>
                      <SelectItem value="maya">Maya</SelectItem>
                    </SelectContent>
                  </Select>
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          />
          <form.Field
            name="accountName"
            children={(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field className="gap-1" data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Account Name</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={isInvalid}
                    autoComplete="off"
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          />
          <form.Field
            name="email"
            children={(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field className="gap-1" data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Email Address</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={isInvalid}
                    autoComplete="off"
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          />
          <form.Field
            name="phoneNumber"
            children={(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field className="gap-1" data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Phonenumber</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={isInvalid}
                    autoComplete="off"
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          />
          <form.Field
            name="alias"
            children={(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field className="gap-1" data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Alias (Optional)</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={isInvalid}
                    autoComplete="off"
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          />
        </FieldGroup>
        <div className="flex items-center gap-2 mt-6">
          <Checkbox
            onCheckedChange={(e) => setIsFavorite(e === true)}
            id="terms"
          />
          <Label htmlFor="terms">Add to Favorites</Label>
        </div>
        <Field className="mt-8" orientation="horizontal">
          <Button
            type="submit"
            className="w-full"
            form="add-payment-method-form"
          >
            Preview Order
          </Button>
        </Field>
      </form>
      <Modal
        isOpen={isLoading}
        onClose={() => {}}
        title=""
        message="Saving payment method..."
        icon={<Loading size="lg" />}
        showCloseButton={false}
        showActionButtons={false}
      />
    </div>
  );
};

export default AddEWallet;
