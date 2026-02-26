"use client";

import { mailchimp } from "@/resources";
import { Button, Heading, Input, Text, Column, Row } from "@once-ui-system/core";
import { useState } from "react";

export const Mailchimp: React.FC<React.ComponentProps<typeof Column>> = ({ ...flex }) => {
  const [email, setEmail] = useState<string>("");

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
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Button type="submit">
            Subscribe
          </Button>
        </Row>

        <Text variant="label-default-s" onBackground="neutral-weak">
          We respect your privacy. Unsubscribe at any time.
        </Text>
      </form>
    </Column>
  );
};
