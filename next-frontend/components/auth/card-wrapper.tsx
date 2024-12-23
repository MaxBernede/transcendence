"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
} from "@/components/ui/card";
import AuthHeader from "./auth-header";
import BackButton from "./back-button";

interface CardWrapperProps {
  label: string;
  title: string;
  backButtonHref: string;
  backButtonLabel: string;
  children: React.ReactNode;
}

const CardWrapper = ({
  label,
  title,
  backButtonHref,
  backButtonLabel,
  children,
}: CardWrapperProps) => {
  return (
    <Card>
      <CardHeader>
        <AuthHeader label={label} title={title} />
      </CardHeader>
      <CardContent>{children}</CardContent>
      <CardFooter></CardFooter>
    </Card>
  );
};

export default CardWrapper;
