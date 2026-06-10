/**
 * Test Data Generator
 *
 * Generates sample Claude export data for testing the import functionality.
 * Covers multiple export formats and conversation types.
 *
 * Run with: npx tsx scripts/generate-test-data.ts > data/test-export.json
 */

const sampleConversations = [
  {
    uuid: 'test-conv-001',
    name: 'Build a Next.js Blog with MDX',
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-15T12:45:00Z',
    chat_messages: [
      {
        uuid: 'msg-001',
        sender: 'human',
        text: 'I want to build a blog using Next.js and MDX. Can you help me set it up?',
        created_at: '2024-01-15T10:30:00Z',
      },
      {
        uuid: 'msg-002',
        sender: 'assistant',
        text: `I'd be happy to help you build a Next.js blog with MDX! Here's a step-by-step guide:

## 1. Project Setup

First, create a new Next.js project:

\`\`\`bash
npx create-next-app@latest my-blog --typescript --tailwind --app
cd my-blog
\`\`\`

## 2. Install MDX Dependencies

\`\`\`bash
npm install @next/mdx @mdx-js/loader @mdx-js/react
\`\`\`

## 3. Configure MDX

Create or update \`next.config.js\`:

\`\`\`javascript
const withMDX = require('@next/mdx')({
  extension: /\\.mdx?$/,
  options: {
    remarkPlugins: [],
    rehypePlugins: [],
  },
})

module.exports = withMDX({
  pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],
})
\`\`\`

Would you like me to continue with the layout and styling?`,
        created_at: '2024-01-15T10:32:00Z',
      },
      {
        uuid: 'msg-003',
        sender: 'human',
        text: 'Yes please! Also add syntax highlighting for code blocks.',
        created_at: '2024-01-15T10:35:00Z',
      },
      {
        uuid: 'msg-004',
        sender: 'assistant',
        text: `Great! Let me show you how to add a beautiful layout and syntax highlighting.

## Blog Layout Component

\`\`\`tsx
// components/BlogLayout.tsx
import { format } from 'date-fns'

interface BlogLayoutProps {
  children: React.ReactNode
  frontmatter: {
    title: string
    date: string
    description: string
  }
}

export function BlogLayout({ children, frontmatter }: BlogLayoutProps) {
  return (
    <article className="max-w-2xl mx-auto py-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold mb-2">{frontmatter.title}</h1>
        <time className="text-gray-500">
          {format(new Date(frontmatter.date), 'MMMM d, yyyy')}
        </time>
        <p className="mt-4 text-lg text-gray-600">
          {frontmatter.description}
        </p>
      </header>
      <div className="prose prose-lg">
        {children}
      </div>
    </article>
  )
}
\`\`\`

This gives you a clean blog layout with MDX support!`,
        created_at: '2024-01-15T10:40:00Z',
      },
    ],
  },
  {
    uuid: 'test-conv-002',
    name: 'Python Data Analysis with Pandas',
    created_at: '2024-01-20T14:00:00Z',
    updated_at: '2024-01-20T16:30:00Z',
    chat_messages: [
      {
        uuid: 'msg-010',
        sender: 'human',
        text: 'Please analyze this CSV data and create visualizations. The data contains sales records.',
        created_at: '2024-01-20T14:00:00Z',
      },
      {
        uuid: 'msg-011',
        sender: 'assistant',
        text: `I'll help you analyze sales data with Python and Pandas.

\`\`\`python
import pandas as pd
import matplotlib.pyplot as plt

df = pd.read_csv('sales_data.csv')
print(df.shape)
print(df.describe())

df['revenue'] = df['revenue'].fillna(0)
df['date'] = pd.to_datetime(df['date'])
\`\`\`

\`\`\`python
monthly = df.groupby(df['date'].dt.to_period('M')).agg({
    'revenue': 'sum',
    'orders': 'sum',
}).reset_index()

top_products = df.groupby('product')['revenue'].sum().sort_values(ascending=False).head(10)
\`\`\``,
        created_at: '2024-01-20T14:15:00Z',
      },
    ],
  },
  {
    uuid: 'test-conv-003',
    name: 'Write a Prompt for Code Review',
    created_at: '2024-02-01T09:00:00Z',
    updated_at: '2024-02-01T10:00:00Z',
    chat_messages: [
      {
        uuid: 'msg-020',
        sender: 'human',
        text: `Write a prompt for automated code review. The prompt should:
- Check for security vulnerabilities
- Identify performance issues
- Suggest code improvements
- Follow best practices

要求：输出格式要结构化，包含严重等级`,
        created_at: '2024-02-01T09:00:00Z',
      },
      {
        uuid: 'msg-021',
        sender: 'assistant',
        text: `Here's a comprehensive code review prompt:

\`\`\`
You are an expert code reviewer. Analyze the provided code and generate a structured review report.

### Review Criteria

1. **Security** (Critical)
   - SQL injection vulnerabilities
   - XSS vulnerabilities
   - Authentication/Authorization issues

2. **Performance** (High)
   - N+1 query problems
   - Missing indexes
   - Inefficient algorithms

### Output Format

\`\`\`json
{
  "summary": "Brief overview of findings",
  "issues": [
    {
      "severity": "critical|high|medium|low",
      "category": "security|performance|quality|practice",
      "line": 42,
      "description": "Description of the issue",
      "suggestion": "How to fix it"
    }
  ],
  "score": 85
}
\`\`\`
\`\`\`

This prompt is reusable for any code review task!`,
        created_at: '2024-02-01T09:10:00Z',
      },
    ],
  },
  {
    uuid: 'test-conv-004',
    name: 'Life Planning: 2024 Goals',
    created_at: '2024-01-01T08:00:00Z',
    updated_at: '2024-01-01T09:30:00Z',
    chat_messages: [
      {
        uuid: 'msg-030',
        sender: 'human',
        text: 'Help me create a life planning document for 2024. Include career goals, health goals, and learning goals.',
        created_at: '2024-01-01T08:00:00Z',
      },
      {
        uuid: 'msg-031',
        sender: 'assistant',
        text: `# 2024 Life Planning Document

## Career Goals
- Learn Rust or Go
- Contribute to 3 open-source projects
- Get AWS Solutions Architect certification

## Health Goals
- Exercise 4 times per week
- Run a half marathon by June
- Meditate 10 minutes daily

## Learning Goals
- Complete System Design course
- Master TypeScript advanced patterns
- Build 3 side projects`,
        created_at: '2024-01-01T08:15:00Z',
      },
    ],
  },
  {
    uuid: 'test-conv-005',
    name: 'Design a Logo for Startup',
    created_at: '2024-02-10T11:00:00Z',
    updated_at: '2024-02-10T12:00:00Z',
    chat_messages: [
      {
        uuid: 'msg-040',
        sender: 'human',
        text: 'I need ideas for a tech startup logo. The company is called "NexusAI" and focuses on AI integration.',
        created_at: '2024-02-10T11:00:00Z',
      },
      {
        uuid: 'msg-041',
        sender: 'assistant',
        text: `Here are some logo concept ideas for NexusAI:

## Concept 1: Neural Network Nexus
- **Icon**: Interconnected nodes forming an "N" shape
- **Colors**: Deep blue (#1E3A5F) + Electric cyan (#00D4FF)

\`\`\`css
:root {
  --nexus-primary: #1E3A5F;
  --nexus-accent: #00D4FF;
  --nexus-dark: #0F172A;
  --nexus-light: #F8FAFC;
}

.logo-text {
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 700;
  letter-spacing: -0.02em;
}
\`\`\``,
        created_at: '2024-02-10T11:20:00Z',
      },
    ],
  },
  {
    uuid: 'test-conv-006',
    name: 'React Native App Navigation Setup',
    created_at: '2024-03-05T09:00:00Z',
    updated_at: '2024-03-05T11:30:00Z',
    chat_messages: [
      {
        uuid: 'msg-050',
        sender: 'human',
        text: 'Help me set up React Navigation v6 with tab and stack navigators in my React Native app.',
        created_at: '2024-03-05T09:00:00Z',
      },
      {
        uuid: 'msg-051',
        sender: 'assistant',
        text: `Here's how to set up React Navigation v6:

\`\`\`tsx
import { NavigationContainer } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'

const Tab = createBottomTabNavigator()
const Stack = createNativeStackNavigator()

function HomeStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Details" component={DetailScreen} />
    </Stack.Navigator>
  )
}

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator>
        <Tab.Screen name="HomeTab" component={HomeStack} />
        <Tab.Screen name="Settings" component={SettingsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  )
}
\`\`\``,
        created_at: '2024-03-05T09:15:00Z',
      },
    ],
  },
  {
    uuid: 'test-conv-007',
    name: 'Database Schema Design for E-commerce',
    created_at: '2024-03-10T14:00:00Z',
    updated_at: '2024-03-10T16:00:00Z',
    chat_messages: [
      {
        uuid: 'msg-060',
        sender: 'human',
        text: 'Design a database schema for an e-commerce platform with products, orders, users, and reviews.',
        created_at: '2024-03-10T14:00:00Z',
      },
      {
        uuid: 'msg-061',
        sender: 'assistant',
        text: `Here's a comprehensive database schema:

\`\`\`sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  stock INTEGER DEFAULT 0,
  category_id UUID REFERENCES categories(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  status VARCHAR(50) DEFAULT 'pending',
  total DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id),
  product_id UUID REFERENCES products(id),
  quantity INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL
);
\`\`\``,
        created_at: '2024-03-10T14:20:00Z',
      },
    ],
  },
  {
    uuid: 'test-conv-008',
    name: 'Research Paper: AI in Healthcare',
    created_at: '2024-03-15T10:00:00Z',
    updated_at: '2024-03-15T12:00:00Z',
    chat_messages: [
      {
        uuid: 'msg-070',
        sender: 'human',
        text: 'Help me write a research paper outline about AI applications in healthcare diagnostics.',
        created_at: '2024-03-15T10:00:00Z',
      },
      {
        uuid: 'msg-071',
        sender: 'assistant',
        text: `# AI in Healthcare Diagnostics: A Comprehensive Review

## Abstract
This paper examines the current state and future potential of artificial intelligence in healthcare diagnostics.

## 1. Introduction
- Background on AI in healthcare
- Scope of the review
- Methodology

## 2. Literature Review
- Deep learning in medical imaging
- Natural language processing for clinical notes
- Predictive analytics for patient outcomes

## 3. Key Applications
- Radiology and pathology
- Drug discovery
- Personalized medicine

## 4. Challenges and Limitations
- Data privacy concerns
- Regulatory requirements
- Integration with existing systems`,
        created_at: '2024-03-15T10:30:00Z',
      },
    ],
  },
]

function generateTestData() {
  return sampleConversations
}

const data = generateTestData()
console.log(JSON.stringify(data, null, 2))
