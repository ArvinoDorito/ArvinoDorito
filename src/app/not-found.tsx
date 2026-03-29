import { Column, Heading, Text, Row, IconButton, SmartLink } from "@once-ui-system/core";
import { person, social } from "@/resources";

export default function NotFound() {
  return (
    <Column as="section" fill center paddingBottom="160">
      <Text marginBottom="s" variant="display-strong-xl">
        404
      </Text>
      <Heading marginBottom="l" variant="display-default-xs">
        Page Not Found
      </Heading>
      <Text onBackground="neutral-weak">The page you are looking for does not exist.</Text>
      <Text onBackground="neutral-weak">Well this isn't fun.. HOW ABOUT THIS! You click one of the icons below to my Socials, and provide me a screenshot of the error and the link so I can fix it, most likely.. probably.. if I'm bothered??</Text>
      <Row gap="16">
        {social.map(
          (item) =>
            item.link && (
              <IconButton
                key={item.name}
                href={item.link}
                icon={item.icon}
                tooltip={item.name}
                size="s"
                variant="danger"
              />
            ),
        )}
      </Row>
    </Column>
  );
}
