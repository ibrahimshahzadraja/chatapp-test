export async function generateMetadata({params}) {

    const {chatname} = await params;
  
    return {
      title: `${chatname} - Join`,
    };
  }
  
  export default function CreateChatLayout({ children, params }) {
    return (
      <div>
        {children}
      </div>
    );
  }
  