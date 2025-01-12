import {
  Box,
  Card,
  CardBody,
  Heading,
  Stack,
  StackDivider,
  Text,
} from "@chakra-ui/react";
import { BsThreeDots } from "react-icons/bs";

export const MessageLeftCard = () => {
  return (
    <Card className="cursor-pointer mt-2">
      <hr />
      <CardBody>
        <Stack divider={<StackDivider />} spacing="4">
          <Box>
            <Heading
              size="xs"
              className="flex items-center text-se justify-between"
            >
              <img
                className="w-9 h-9 rounded-full mr-2"
                src="https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_640.png"
                alt=""
              />
              <p className="mr-10 font-semibold">UserName</p>
              <BsThreeDots />
            </Heading>

            <div className="flex">
              <Text className="pt-2 text-sm">Some message</Text>
              <Text className="mt-2 ml-2 text-sm">•</Text>
              <Text className="mt-1.5 ml-2"> 1 min</Text>
            </div>
          </Box>
        </Stack>
      </CardBody>
      <hr />
    </Card>
  );
};
