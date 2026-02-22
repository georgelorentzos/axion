import Input from "../../Input";
import Button from "../../Button";

export default function CreateCategory(){
    return(
        <>
          <div className="flex flex-col text-center">
            <div className="font-bold text-[20px]">Create Category</div>
            <div className="text-gray-500">Categories help you group channels.</div>
          </div>
          <Input
            placeholder="Category Name"
          />
          <Button text="Create" isGreen />
        </>
    );
}