import Input from "../../Input";
import Button from "../../Button";

type CreateItemProps = {
    item: "category" | "channel";
}

const config = {
    category: { title: "Create Category", description: "Categories help you group channels.", placeholder: "Category Name" },
    channel: { title: "Create Channel", description: "Channels keep conversations organized.", placeholder: "Channel Name" },
};

export default function CreateItem({ item }: CreateItemProps) {
    const { title, description, placeholder } = config[item];

    return (
        <>
            <div className="flex flex-col text-center">
                <div className="font-bold text-[20px]">{title}</div>
                <div className="text-gray-500">{description}</div>
            </div>
            <Input placeholder={placeholder} />
            <Button text="Create" isGreen />
        </>
    );
}
