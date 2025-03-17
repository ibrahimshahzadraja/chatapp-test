export async function generateMetadata({ params }) {
    const { chatname } = await params;
  
    return {
      title: `${chatname} - Admin Panel`,
    };
  }
  
  export default function EditChatLayout({ children, params }) {
    return (
      <div>
        {children}
      </div>
    );
  }
  