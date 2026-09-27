import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';

import Heading from '@theme/Heading';
import styles from './index.module.css';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)} style={{ backgroundColor: 'var(--ifm-background-surface-color)' }}>
      <div className="container" style={{ padding: '4rem 0' }}>
        <div style={{ display: 'inline-block', padding: '0.25rem 1rem', borderRadius: '999px', border: '1px solid var(--ifm-color-primary)', backgroundColor: 'rgba(14, 243, 141, 0.1)', color: 'var(--ifm-color-primary)', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
          Local-First & Privacy-Focused Workspace
        </div>
        <Heading as="h1" className="hero__title" style={{ fontSize: '3.5rem', fontWeight: '800', lineHeight: '1.1' }}>
          Visualize Your Markdown <span style={{ color: 'var(--ifm-color-primary)' }}>Project Files</span>
        </Heading>
        <p className="hero__subtitle" style={{ color: 'var(--ifm-color-emphasis-600)', maxWidth: '600px', margin: '1rem auto' }}>
          Instantly transform your standard .md notes into interactive Mindmaps, Kanban Boards, Metadata Tables, and Calendars directly inside Visual Studio Code.
        </p>
        <div className={styles.buttons} style={{ marginTop: '2rem', gap: '1rem', display: 'flex', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link
            className="button button--lg"
            to="/docs/markdown-formatting"
            style={{ backgroundColor: 'var(--ifm-color-primary)', color: '#000', border: 'none', fontWeight: 'bold' }}>
            Get Started with Formatting
          </Link>
          <a
            className="button button--outline button--lg"
            href="[Download URL]"
            style={{ borderColor: 'var(--ifm-color-primary)', color: 'var(--ifm-font-color-base)' }}>
            Download Extension
          </a>
        </div>
      </div>
    </header>
  );
}

function HomepageFeatures() {
  return (
    <section style={{ padding: '4rem 0', backgroundColor: 'var(--ifm-background-color)' }}>
      <div className="container text--center">
        <h2 style={{ fontSize: '2.5rem', marginBottom: '3rem' }}>One Markdown File, Six View Angles</h2>
        <div className="row">
          <div className="col col--4" style={{ marginBottom: '2rem' }}>
            <div style={{ padding: '2rem', backgroundColor: 'var(--ifm-background-surface-color)', borderRadius: '1rem', border: '1px solid var(--ifm-color-emphasis-200)', height: '100%' }}>
              <h3 style={{ fontSize: '1.25rem' }}>Visual Tree (Mindmap)</h3>
              <p style={{ color: 'var(--ifm-color-emphasis-600)' }}>Interactive visualization of your ideation tree and project task connections.</p>
            </div>
          </div>
          <div className="col col--4" style={{ marginBottom: '2rem' }}>
            <div style={{ padding: '2rem', backgroundColor: 'var(--ifm-background-surface-color)', borderRadius: '1rem', border: '1px solid var(--ifm-color-emphasis-200)', height: '100%' }}>
              <h3 style={{ fontSize: '1.25rem' }}>Agile Workflow (Kanban)</h3>
              <p style={{ color: 'var(--ifm-color-emphasis-600)' }}>Drag and drop tasks between statuses fluidly.</p>
            </div>
          </div>
          <div className="col col--4" style={{ marginBottom: '2rem' }}>
            <div style={{ padding: '2rem', backgroundColor: 'var(--ifm-background-surface-color)', borderRadius: '1rem', border: '1px solid var(--ifm-color-emphasis-200)', height: '100%' }}>
              <h3 style={{ fontSize: '1.25rem' }}>Database Grid (Table)</h3>
              <p style={{ color: 'var(--ifm-color-emphasis-600)' }}>Sort, filter, and manage custom columns dynamically.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={`Home`}
      description="Documentation for MD Flow VS Code Extension">
      <HomepageHeader />
      <main>
        <HomepageFeatures />
        
        <div className="container" style={{ padding: '4rem 0', textAlign: 'center', borderTop: '1px solid var(--ifm-color-emphasis-200)' }}>
          <h2 style={{ marginBottom: '1rem' }}>Open Source & Universal</h2>
          <p style={{ fontSize: '1.1rem', color: 'var(--ifm-color-emphasis-600)', maxWidth: '700px', margin: '0 auto 2rem auto' }}>
            MD Flow is open source! Contribute to the project on GitHub. <br/> 
            We also provide a fully-featured web application for browser-based workflow.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <a href="https://github.com/serbamarketing/vsix-mdflow" target="_blank" rel="noopener noreferrer" className="button button--secondary button--lg">
              View on GitHub
            </a>
            <a href="https://mdflow.spawnera.com" target="_blank" rel="noopener noreferrer" className="button button--secondary button--lg">
              Visit Web App
            </a>
          </div>
        </div>
      </main>
    </Layout>
  );
}
