import Input from "../../Input";
import Button from "../../Button";

export default function CreateChannel(){
    return(
        <>
          <div className="flex flex-col text-center">
            <div className="font-bold text-[20px]">Create Channel</div>
            <div className="text-gray-500">Channels keep conversations organized.</div>
          </div>
          <Input
            placeholder="Channel Name"
          />
          <Button text="Create" isGreen />
        </>
    );
}