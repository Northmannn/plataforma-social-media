import { InstagramPost } from "@/hooks/useInstagramPostsFromDB";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PerformanceChartsProps {
  posts: InstagramPost[];
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--muted-foreground))', 'hsl(var(--foreground))'];

const tooltipStyle = {
  backgroundColor: "#1a1a2e",
  border: "1px solid #05e6cc",
  borderRadius: "8px",
  fontSize: "12px",
  color: "#f1f5f9",
  padding: "8px 12px",
};

export const PerformanceCharts = ({ posts }: PerformanceChartsProps) => {
  const timelineData = posts
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .map(post => ({
      date: format(new Date(post.timestamp), "dd/MM", { locale: ptBR }),
      engagement: post.likesCount + post.commentsCount,
    }));

  const typeDistribution = posts.reduce((acc, post) => {
    acc[post.type] = (acc[post.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(typeDistribution).map(([type, count]) => ({
    name: type,
    value: count,
  }));

  const topPostsData = [...posts]
    .sort((a, b) => (b.likesCount + b.commentsCount) - (a.likesCount + a.commentsCount))
    .slice(0, 5)
    .map((post, index) => ({
      name: `Post ${index + 1}`,
      engagement: post.likesCount + post.commentsCount,
    }));

  return (
    <div className="space-y-0">
      {/* Evolução do Engagement */}
      <div className="border-b border-border/20 pb-8 mb-8">
        <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-4">
          Evolução do Engagement
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={timelineData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.2)" />
            <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
            <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: "#f1f5f9" }} labelStyle={{ color: "#94a3b8" }} />
            <Line
              type="monotone"
              dataKey="engagement"
              stroke="hsl(var(--primary))"
              strokeWidth={1.5}
              dot={{ fill: "hsl(var(--primary))", r: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Top 5 Posts */}
      <div className="border-b border-border/20 pb-8 mb-8">
        <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-4">
          Top 5 Posts
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={topPostsData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.2)" />
            <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
            <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: "#f1f5f9" }} labelStyle={{ color: "#94a3b8" }} />
            <Bar dataKey="engagement" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Distribuição de Tipos */}
      <div>
        <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-4">
          Distribuição de Tipos
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="hsl(var(--primary))"
              dataKey="value"
              nameKey="name"
            >
              {pieData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={tooltipStyle}
              itemStyle={{ color: "#f1f5f9" }}
              labelStyle={{ color: "#94a3b8" }}
              formatter={(value: number, name: string) => [`${value} posts`, name]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
