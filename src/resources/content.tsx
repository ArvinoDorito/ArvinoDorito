import { About, Blog, Gallery, Home, Person, Social, Work } from "@/types";
import { Line, Row, Text } from "@once-ui-system/core";

const person: Person = {
  firstName: "Arvin",
  lastName: "Ghajari",
  name: `ArvinoDorito`,
  role: "Modeller",
  avatar: "/images/avatar.jpg",
  email: "av.ghajari@gmail.com",
  location: "Europe/London", // Expecting the IANA time zone identifier, e.g., 'Europe/Vienna'
  languages: ["English"], // optional: Leave the array empty if you don't want to display languages
};

const social: Social = [
  // Links are automatically displayed.
  // Import new icons in /once-ui/icons.ts
  // Set essentials: true for links you want to show on the about page
  {
    name: "GitHub",
    icon: "github",
    link: "https://github.com/ArvinoDorito",
    essential: true,
  },
  {
    name: "Discord",
    icon: "discord",
    link: "https://discord.com/users/1102466688886255658",
    essential: true,
  },
  {
    name: "Email",
    icon: "email",
    link: `mailto:${person.email}`,
    essential: true,
  },
];

const home: Home = {
  path: "/",
  image: "/images/og/home.jpg",
  label: "Home",
  title: `${person.name}'s Portfolio`,
  description: `Portfolio website showcasing my work as a ${person.role}`,
  headline: <>ArvinoDorito</>,
  featured: {
    display: true,
    title: (
      <Row gap="12" vertical="center">
        <strong className="ml-4">BTD</strong>{" "}
        <Line background="brand-alpha-strong" vert height="20" />
        <Text marginRight="4" onBackground="brand-medium">
          Featured work
        </Text>
      </Row>
    ),
    href: "/work/building-once-ui-a-customizable-design-system",
  },
  subline: (
    <>
    I'm a Roblox <Text as="span" size="xl" weight="strong">UGC and Modeller</Text>.
</>
  ),
};

const about: About = {
  path: "/about",
  label: "About",
  title: `About – ${person.name}`,
  description: `Meet ${person.name}, ${person.role} from ${person.location}`,
  tableOfContent: {
    display: true,
    subItems: false,
  },
  avatar: {
    display: true,
  },
  calendar: {
    display: true,
    link: "https://cal.com",
  },
  intro: {
    display: true,
    title: "Introduction",
    description: (
      <>
        I am a Roblox UGC creator and Modeller.
      </>
    ),
  },
  work: {
    display: true, // set to false to hide this section
    title: "Work Experience",
    experiences: [
      {
        company: "BTD",
        timeframe: "Dec 2025 - Present",
        role: "UGC Merchant",
        achievements: [
          <>
            Creating a Variety of Formal UGCs for The Knight's Wardrobe.
          </>,
          <>
            Using Blender and Substance Painter
          </>,
          <>
            Modelling, UV Mapping and Texturing
          </>,
        ],
        images: [
          // optional: leave the array empty if you don't want to display images
          {
            src: "public/images/gallery/Image-14.png",
            alt: "BTD Project",
            width: 16,
            height: 9,
          },
          {
            src: "public/images/gallery/Image-15.png",
            alt: "BTD Project",
            width: 16,
            height: 9,
          },{
            src: "public/images/gallery/Image-16.png",
            alt: "BTD Project",
            width: 16,
            height: 9,
          },
          {
            src: "public/images/gallery/Image-17.png",
            alt: "BTD Project",
            width: 16,
            height: 9,
          },
          {
            src: "public/images/gallery/Image-18.png",
            alt: "BTD Project",
            width: 16,
            height: 9,
          },
          {
            src: "public/images/gallery/Image-19.png",
            alt: "BTD Project",
            width: 16,
            height: 9,
          },
          {
            src: "public/images/gallery/Image-20.png",
            alt: "BTD Project",
            width: 16,
            height: 9,
          },
          {
            src: "public/images/gallery/Image-21.png",
            alt: "BTD Project",
            width: 16,
            height: 9,
          },
          {
            src: "public/images/gallery/Image-22.png",
            alt: "BTD Project",
            width: 16,
            height: 9,
          },
          {
            src: "public/images/gallery/Image-23.png",
            alt: "BTD Project",
            width: 16,
            height: 9,
          },
        ],
      },
    ],
  },
  studies: {
    display: false, // set to false to hide this section
    title: "Studies",
    institutions: [
      {
        name: "",
        description: <></>,
      },
    ],
  },
  technical: {
    display: true, // set to false to hide this section
    title: "Technical skills",
    skills: [
      {
        title: "Blender",
        description: (
          <>Able to Model Items and UV map them.
          </>
        ),
        tags: [
          {
            name: "Blender",
            icon: "blender",
          },
        ],
        // optional: leave the array empty if you don't want to display images
        images: [
          {
            src: "public/images/gallery/Image-14.png",
            alt: "BTD Project",
            width: 16,
            height: 9,
          },
          {
            src: "public/images/gallery/Image-15.png",
            alt: "BTD Project",
            width: 16,
            height: 9,
          },
          {
            src: "public/images/gallery/Image-16.png",
            alt: "BTD Project",
            width: 16,
            height: 9,
          },
          {
            src: "public/images/gallery/Image-17.png",
            alt: "BTD Project",
            width: 16,
            height: 9,
          },
          {
            src: "public/images/gallery/Image-18.png",
            alt: "BTD Project",
            width: 16,
            height: 9,
          },
        ],
      },
      {
        title: "Adobe Substance Painter",
        description: (
          <>Able to Texture Models using Substance Painter</>
        ),
        tags: [
          {
            name: "Adobe",
            icon: "adobe",
          },
        ],
        // optional: leave the array empty if you don't want to display images
        images: [
          {
            src: "public/images/gallery/Image-19.png",
            alt: "BTD Project",
            width: 16,
            height: 9,
          },
          {
            src: "public/images/gallery/Image-20.png",
            alt: "BTD Project",
            width: 16,
            height: 9,
          },
          {
            src: "public/images/gallery/Image-21.png",
            alt: "BTD Project",
            width: 16,
            height: 9,
          },
          {
            src: "public/images/gallery/Image-21.png",
            alt: "BTD Project",
            width: 16,
            height: 9,
          },
          {
            src: "public/images/gallery/Image-22.png",
            alt: "BTD Project",
            width: 16,
            height: 9,
          },
          {
            src: "public/images/gallery/Image-23.png",
            alt: "BTD Project",
            width: 16,
            height: 9,
          },
        ],
      },
    ],
  },
};

const blog: Blog = {
  path: "/projects",
  label: "Projects",
  title: "Projects coming soon..",
  description: `Read what ${person.name} has been up to recently`,
  // Create new blog posts by adding a new .mdx file to app/blog/posts
  // All posts will be listed on the /blog route
};

const work: Work = {
  path: "/work",
  label: "Work",
  title: `Projects – ${person.name}`,
  description: `My projects`,
  // Create new project pages by adding a new .mdx file to app/blog/posts
  // All projects will be listed on the /home and /work routes
};

const gallery: Gallery = {
  path: "/gallery",
  label: "Gallery",
  title: `Photo gallery – ${person.name}`,
  description: ``,
  // Images by https://lorant.one
  // These are placeholder images, replace with your own
  images: [
    {
      src: "public/images/gallery/Image-14.png",
      alt: "image",
      orientation: "horizontal",
    },
    {
      src: "public/images/gallery/Image-15.png",
      alt: "image",
      orientation: "horizontal",
    },
    {
      src: "public/images/gallery/Image-16.png",
      alt: "image",
      orientation: "horizontal",
    },
    {
      src: "public/images/gallery/Image-17.png",
      alt: "image",
      orientation: "vertical",
    },
    
    {
      src: "public/images/gallery/Image-18.png",
      alt: "image",
      orientation: "vertical",
    },
    {
      src: "public/images/gallery/Image-19.png",
      alt: "image",
      orientation: "horizontal",
    },
    {
      src: "public/images/gallery/Image-20.png",
      alt: "image",
      orientation: "horizontal",
    },
    {
      src: "public/images/gallery/Image-21.png",
      alt: "image",
      orientation: "horizontal",
    },
    {
      src: "public/images/gallery/Image-22.png",
      alt: "image",
      orientation: "horizontal",
    },
    {
      src: "public/images/gallery/Image-23.png",
      alt: "image",
      orientation: "horizontal",
    },
  ],
};

export { person, social, home, about, blog, work, gallery };
