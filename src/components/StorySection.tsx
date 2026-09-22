import "./StorySection.css";
import { useWedding } from "../lib/WeddingContext";

type StoryItem = {
  id?: string | number;
  year?: string | number;
  date?: string;
  title?: string;
  name?: string;
  description?: string;
  content?: string;
  text?: string;
};

type StoryData = {
  title?: string;
  subtitle?: string;
  description?: string;
  items?: StoryItem[];
};

function normalizeStories(value: unknown): StoryItem[] {
  if (Array.isArray(value)) {
    return value as StoryItem[];
  }

  if (
    value &&
    typeof value === "object" &&
    Array.isArray((value as StoryData).items)
  ) {
    return (value as StoryData).items || [];
  }

  return [];
}

export default function StorySection() {
  const { mergedData } = useWedding();

  const weddingData = mergedData as Record<
    string,
    unknown
  > | null;

  const rawStory =
    weddingData?.story ??
    weddingData?.stories ??
    weddingData?.loveStory ??
    weddingData?.love_story;

  const storyObject =
    rawStory &&
    typeof rawStory === "object" &&
    !Array.isArray(rawStory)
      ? (rawStory as StoryData)
      : null;

  const stories = normalizeStories(rawStory);

  const sectionTitle =
    storyObject?.title ||
    "Kisah Kami";

  const sectionDescription =
    storyObject?.description ||
    storyObject?.subtitle ||
    "Setiap pertemuan memiliki cerita, dan setiap cerita membawa kami sampai di hari ini.";

  return (
    <section
      id="story"
      className="story-section"
      aria-labelledby="story-title"
    >
      <div className="story-background-glow story-background-glow-left" />
      <div className="story-background-glow story-background-glow-right" />

      <div className="story-inner">
        <header className="story-header">
          <span className="story-eyebrow">
            Perjalanan Cinta
          </span>

          <h2 id="story-title">
            {sectionTitle}
          </h2>

          <span className="story-divider">
            <span />
            <i>✦</i>
            <span />
          </span>

          <p>{sectionDescription}</p>
        </header>

        {stories.length > 0 ? (
          <div className="story-timeline">
            {stories.map((story, index) => {
              const title =
                story.title ||
                story.name ||
                `Cerita ${index + 1}`;

              const year =
                story.year ||
                story.date ||
                "";

              const description =
                story.description ||
                story.content ||
                story.text ||
                "";

              return (
                <article
                  key={
                    story.id ||
                    `${title}-${index}`
                  }
                  className={`story-item ${
                    index % 2 === 0
                      ? "story-item-left"
                      : "story-item-right"
                  }`}
                >
                  <div className="story-item-side">
                    <span className="story-year">
                      {year}
                    </span>
                  </div>

                  <div className="story-dot">
                    <span />
                  </div>

                  <div className="story-card">
                    <div className="story-card-border">
                      <span className="story-card-corner top-left" />
                      <span className="story-card-corner top-right" />
                      <span className="story-card-corner bottom-left" />
                      <span className="story-card-corner bottom-right" />

                      <h3>{title}</h3>

                      {description && (
                        <p>{description}</p>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="story-empty">
            <span className="story-empty-symbol">
              ✦
            </span>

            <p>
              Kisah indah kami akan segera ditambahkan.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
