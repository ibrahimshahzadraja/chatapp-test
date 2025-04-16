export async function generateMetadata({ params }) {
    const { chatname } = await params;
  
    return {
      title: `${decodeURIComponent(chatname)} - Admin Panel`,
    };
  }
  
  export default function EditChatLayout({ children, params }) {
    return (
      <div>
        {children}
      </div>
    );
  }
  