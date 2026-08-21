import { ProfileContentBase } from "../ProfileContentBase";

interface ContentBaseViewProps {
  profileId: string;
  username: string;
}

export const ContentBaseView = ({ profileId, username }: ContentBaseViewProps) => {
  return <ProfileContentBase profileId={profileId} username={username} />;
};
