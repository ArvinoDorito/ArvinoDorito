"use client";

import { mailchimp } from "@/resources";
import {
  Button,
  Heading,
  Input,
  Text,
  Background,
  Column,
  Row,
} from "@once-ui-system/core";
import { opacity, SpacingToken } from "@once-ui-system/core";
import { useState } from "react";

function debounce<T extends (...args: any[]) => void>(func: T, delay: number): T {
  let timeout: ReturnType<typeof setTimeout>;
  return ((...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), delay);
  }) as T;
}

export const Mailchimp: React.FC<React.ComponentProps<typeof Column>> = ({
  ...flex
}) => {
  const [email, setEmail] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [touched, setTouched] = useState<boolean>(false);

  const validateEmail = (email: string): boolean => {
    if (email === "") {
      return true;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);

    if (!validateEmail(value)) {
      setError("Please enter a valid email address.");
    } else {
      setError("");
    }
  };

  const debouncedHandleChange = debounce(handleChange, 500);

  const handleBlur = () => {
    setTouched(true);
    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
    }
  };

  return (
    <Column {...flex} gap="16" fillWidth>
      <Heading as="h3" variant="heading-strong-m">
        Subscribe to updates
      </Heading>

      <form
        action={mailchimp.action}
        method="post"
        target="_blank"
        noValidate
      >
        <Row gap="8">
          <Input
            id="mce-EMAIL"
            name="EMAIL"
            type="email"
            value={email}
            onChange={debouncedHandleChange}
            onBlur={handleBlur}
            hasError={touched && !!error}
            placeholder="Enter your email"
            required
          />

          <Button type="submit" disabled={!!error}>
            Subscribe
          </Button>
        </Row>

        {touched && error && (
          <Text onBackground="danger-strong" variant="label-default-s">
            {error}
          </Text>
        )}
      </form>
    </Column>
  );
};
