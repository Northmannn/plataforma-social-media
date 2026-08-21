import { PostsTable } from "../PostsTable";

interface PostsViewProps {
  posts: any[];
}

export const PostsView = ({ posts }: PostsViewProps) => {
  return <PostsTable posts={posts} />;
};
